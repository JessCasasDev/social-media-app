const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("../keys/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://social-media-e5acf.firebaseio.com"
});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

exports.dotScreams = functions.https.onRequest((request, response) => {
    admin.firestore().collection('screams').get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push(doc.data());
            });

            return response.json(screams);
        })
        .catch(error => {
            console.error(error);
        })
});

exports.createScream = functions.https.onRequest((request, response) => {
    const newScream = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
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
        })
})