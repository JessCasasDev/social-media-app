const { admin, db } = require('./admin');

module.exports = (request, response, next) => {
    let idToken;
    if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        //Get token from headers
        idToken = request.headers.authorization.split('Bearer ')[1];
    }
    else {
        console.error('No token found');

        return response.status(403).json({ error: 'Unauthorized' });
    }

    //Verify if token is still valid on FB
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            request.user = decodedToken;

            return db.collection('users')
                .where('userId', '==', request.user.uid)
                .limit(1)
                .get()
        })
        .then(data => {
            //Add the handle in request
            request.user.handle = data.docs[0].data().handle;
            request.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch(error => {
            console.error(error);
            return response.status(403).json(error)
        });
}