const admin = require('firebase-admin');

var serviceAccount = require("../../keys/serviceAccountKey.json");

admin.initializeApp(
    {
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://social-media-e5acf.firebaseio.com"
    }
);

const db = admin.firestore();

module.exports = { admin, db };