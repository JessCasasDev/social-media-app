//imports
const functions = require('firebase-functions');

const app = require('express')();
const { getAllScreams, postScream, getScream, commentOnScream } = require('./handlers/screams');
const { signup, login, uploadImage } = require('./handlers/users');
const FBAuth = require('./util/fbAuth')

//Users routes
app.post('/signup', signup);
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)

//Screams Routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postScream);
app.get('/scream/:screamId', getScream)
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);

exports.api = functions.https.onRequest(app);