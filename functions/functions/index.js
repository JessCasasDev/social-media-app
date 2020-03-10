const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const app = express();

var serviceAccount = require("../keys/serviceAccountKey.json");

admin.initializeApp(
    {
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://social-media-e5acf.firebaseio.com"
    }
);

app.get('/screams', (request, response) => {
    admin
    .firestore()
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

    admin.firestore()
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

exports.api = functions.https.onRequest(app);