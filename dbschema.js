let db = {
    screams: [
        {
            userHandle: 'usesr',
            body: 'body',
            createdAt: "2020-03-10T15:33:38.414Z",
            likeCount: 5,
            commentCount: 2,
        }
    ],
    users: [
        {
            userId: 'SomeIdrequiried',
            email: 'user_email@yopmail.com',
            handle: 'user',
            createdAt: "2020-03-10T15:33:38.414Z",
            imageUrl: 'some/path/to/add/image',
            bio: 'Bio for user',
            website: 'https://no-user.com',
            location: 'Bogota, Colombia',
        }
    ]
}

const userDetails = {
    credentials: {
        userId: 'SomeIdrequiried',
        email: 'user_email@yopmail.com',
        handle: 'user',
        createdAt: "2020-03-10T15:33:38.414Z",
        imageUrl: 'some/path/to/add/image',
        bio: 'Bio for user',
        website: 'https://no-user.com',
        location: 'Bogota, Colombia',
    },
    likes: [
        {
            userHandle: 'user',
            screamId: 'sdfsodfidf',
        },
        {
            userHandle: 'user',
            screamId: 'QWEcDfS345SSS',
        }
    ]
}