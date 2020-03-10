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


//Users
app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }

    let uToken, userId;
    //TODO validate data
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return response.status(400).json({ handle: 'this handle is already taken' })
            }
            else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(token => {
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
})

exports.api = functions.https.onRequest(app);