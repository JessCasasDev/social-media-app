const { db } = require('../util/admin');


/* Create a new scream */
exports.postScream = (request, response) => {
    const newScream = {
        body: request.body.body,
        userHandle: request.user.handle,
        userImg: request.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
    }

    db
        .collection('screams')
        .add(newScream)
        .then(doc => {
            newScream.screamId = doc.id;
            return response.json(newScream);
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
        return response.status(400).json({ comment: 'Must not be empty' })
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
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 })

        })
        .then(() => {
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


exports.likeScream = (request, response) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', request.user.handle)
        .where('screamId', '==', request.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${request.params.screamId}`);

    let screamData = {};

    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();

            }
            else {
                return response.status(404).json({ error: 'Scream not found' });
            }
        })
        .then(data => {
            if (data.empty) {
                return db.collection('likes').add({
                    screamId: request.params.screamId,
                    userHandle: request.user.handle,
                    createdAt: new Date().toISOString(),
                })
                    .then(() => {
                        screamData.likeCount++;
                        return screamDocument.update({ likeCount: screamData.likeCount });
                    })
                    .then(() => {
                        return response.json(screamData);
                    })
            }
            else {
                return response.status(400).json({ error: 'Cannot like twice same scream' });
            }
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
}


exports.unlikeScream = (request, response) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', request.user.handle)
        .where('screamId', '==', request.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${request.params.screamId}`);

    let screamData = {};

    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();

            }
            else {
                return response.status(404).json({ error: 'Scream not found' });
            }
        })
        .then(data => {
            if (data.empty) {
                return response.status(400).json({ error: 'Scream not liked' });

            }
            else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({ likeCount: screamData.likeCount });
                    })
                    .then(() => {
                        return response.json(screamData);
                    })
            }
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
}


/* Delete Scream */
exports.deleteScream = (request, response) => {
    const document = db.doc(`/screams/${request.params.screamId}`);
    document.get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Scream not found' });
            }
            if (doc.data().userHandle !== request.user.handle) {
                return response.status(403).json({ error: 'Unauthorized' });
            }
            else {
                return document.delete();
            }
        })
        .then(() => {
            return response.json({ message: 'Scream deleted successfully' });
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
}