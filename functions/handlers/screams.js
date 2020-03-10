const { db } = require('../util/admin');



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