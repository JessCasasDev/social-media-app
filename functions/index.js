//imports
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const firebase = require('firebase');

//var declarations
var serviceAccount = require("../keys/serviceAccountKey.json");

const config = {
    apiKey: "AIzaSyAsCt5s63GiDxrAA3Af-bDQzFRqe8daD5g",
    authDomain: "social-media-e5acf.firebaseapp.com",
    databaseURL: "https://social-media-e5acf.firebaseio.com",
    projectId: "social-media-e5acf",
    storageBucket: "social-media-e5acf.appspot.com",
    messagingSenderId: "272151115782",
    appId: "1:272151115782:web:7beabde055e0062bcbeb87",
    measurementId: "G-1W0TXZXH8D"
};

//initial 
admin.initializeApp(
    {
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://social-media-e5acf.firebaseio.com"
    }
);

firebase.initializeApp(config);

const db = admin.firestore();

//API

//Screams
app.get('/screams', (request, response) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(info => {
            let screams = [];
            info.forEach(doc => {
                let data = doc.data();
                screams.push({
                    screamId: doc.id,
                    ...data
                });
            });

            return response.json(screams);
        })
        .catch(error => {
            console.error(error);
        });
});


app.post('/scream', (request, response) => {
    const newScream = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: new Date().toISOString(),
    }

    db
        .collection('screams')
        .add(newScream)
        .then(doc => {
            return response.json({ message: `document ${doc.id} created successfully!` })
        })
        .catch(error => {
            response.status(500).json({ error: 'Something went wrong' })
            console.error(error);
        });
});

const isEmpty = (string) => {
    return string.trim() === '';
}

const isEmail = (email) => {
    const regEx = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    return email.match(regEx);
}

//Users
app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }

    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = 'Must not be empty';
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email address';
    }

    if (isEmpty(newUser.password)) errors.password = 'Must not be empty';
    if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

    if (Object.keys(errors).length > 0) {
        return response.status(400).json(errors);
    }

    let uToken, userId;
    //TODO validate data
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
        .then(token => {
            //create user credentials
            uToken = token;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                created: new Date().toISOString(),
                userId,
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ uToken })
        })
        .catch(error => {
            console.error(error);
            if (error.code === "auth/email-already-in-use") {
                return response.status(400).json({ email: 'Email is already in use' });
            }
            return response.status(500).json({ error: error.code });
        });
});


app.post('/login', (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }

    let errors = {}
    if (isEmpty(user.email)) errors.email = 'Must not be empty';
    if (isEmpty(user.password)) errors.password = 'Must not be empty';

    if (Object.keys(errors) > 0) {
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
})



exports.api = functions.https.onRequest(app);