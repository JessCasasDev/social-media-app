const { db } = require('../util/admin');


/* Create a new scream */
exports.postScream = (request, response) => {
    const newScream = {
        body: request.body.body,
        userHandle: request.user.handle,
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
}

/* Get all screams */
exports.getAllScreams = (request, response) => {
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
};

/* Get the detail of a post with comments ordered by created time */
exports.getScream = (request, response) => {
    let screamData = {};
    db.doc(`/screams/${request.params.screamId}`)
        .get()
        .then(doc => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Scream not found' });
            }

            screamData = doc.data();
            screamData.screamId = doc.id;
            return db.collection('comments')
                .orderBy('createdAt', 'desc')
                .where('screamId', '==', request.params.screamId)
                .get();
        })
        .then(data => {
            screamData.comments = [];
            data.forEach(doc => {
                screamData.comments.push(doc.data())
            });
            return response.json(screamData);
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
}

//Create a comment on Post
exports.commentOnScream = (request, response) => {
    if (request.body.body.trim() === '') {
        return response.status(400).json({ error: 'Must not be empty' })
    }

    const newComment = {
        body: request.body.body,
        createdAt: new Date().toISOString(),
        screamId: request.params.screamId,
        userHandle: request.user.handle,
        userImg: request.user.imageUrl
    }

    db.doc(`/screams/${request.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Scream not found' });
            }

            return db.collection('comments').add(newComment);
        })
        .then(() => {
            return response.json(newComment);
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: 'Something went wrong' });
        });
}