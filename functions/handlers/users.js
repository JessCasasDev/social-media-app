const { db, admin } = require('../util/admin');
const firebase = require('firebase');
const config = require('../util/config');
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

firebase.initializeApp(config);


exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }

    const { errors, valid } = validateSignupData(newUser);

    if (!valid) {
        return response.status(400).json(errors);
    }

    const noImage = 'unnamed.png';

    let token, userId;
    
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            //Validate if user exists, return error if or create a new one  
            if (doc.exists) {
                return response.status(400).json({ handle: 'this handle is already taken' })
            }
            else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            //get user Info
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(uToken => {
            //create user credentials
            token = uToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                created: new Date().toISOString(),
                userId,
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImage}?alt=media`,
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ token })
        })
        .catch(error => {
            console.error(error);
            if (error.code === "auth/email-already-in-use") {
                return response.status(400).json({ email: 'Email is already in use' });
            }
            return response.status(500).json({ error: error.code });
        });
}

exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }

    const { errors, valid } = validateLoginData(user);

    if (!valid) {
        return response.status(400).json(errors);
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return response.json({ token })
        })
        .catch(error => {
            console.error(error);
            if (error.code === "auth/wrong-password") {
                //Unauthorized!
                return response.status(403).json({ general: 'Wrong credential. Please try again' });
            }

            return response.status(500).json({ error: error.code });
        })
}

let imageFileName, imageToBeUploaded = {};

exports.uploadImage = (request, response) => {
    const Busboy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');


    const busboy = new Busboy({ headers: request.headers });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json({ error: 'Wrong file type' });
        }
        let fileEx = filename.split('.');
        const imageExtension = fileEx[fileEx.length - 1];

        imageFileName = `${Math.round(Math.random() * 100000000)}.${imageExtension}`;

        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };

        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        admin.storage().bucket(config.storageBucket).upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${request.user.handle}`).update({ imageUrl });
            })
            .then(() => {
                return response.json({ message: 'Image uploaded successfully' })
            })
            .catch(error => {
                console.error(error);
                return response.status(500).json({ error: error.code });
            });
    });

    busboy.end(request.rawBody);
}

/* Get own user details */
exports.addUserDetails = (request, response) => {
    let userDetails = reduceUserDetails(request.body);
    db.doc(`/users/${request.user.handle}`).update(userDetails)
        .then(() => {
            return response.json({ message: 'Details added successfully' });
        }).catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        })
}

/* Get a user details */
exports.getAuthenticatedUser = (request, response) => {
    let userData = {};

    db.doc(`/users/${request.user.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', request.user.handle).get();
            }
        })
        .then(data => {
            userData.likes = [];
            data.forEach(doc => {
                userData.likes.push(doc.data());
            });
            return response.json(userData);
        })
        .catch(error => {
            console.error(error);
            return response.response(500).json({ error: error.code });
        })
}