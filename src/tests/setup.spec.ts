const path = require('path');
const config: any = {
    db: {
        mongo: {
            server: 'mongodb://localhost:27017/',
            db: 'test'
        }
    }
};

import { DBHandler } from '../connect';
DBHandler.config = {
    connections: {
        'default': {
            server: 'mongodb://localhost:27017',
            db: 'test',
            poolSize: 10,
            ssl: false,
            exchanges: ['event-bus', 'cache-bus'],
            readPreference: 'primaryPreferred'
        }
    }

}

import * as mongo from 'mongodb';

const collectionsNames = ['Alert', 'Case', 'Company', 'User'];
let connection: any = null;


export async function getConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
        mongo.MongoClient.connect(config.db.mongo.server, { poolSize: 10, useUnifiedTopology: true }, function (err: any, client: any) {
            if (err) {
                return reject(err);
            }
            resolve(client.db(config.db.mongo.db));
        });
    });
}

function init() {

    beforeEach(async () => {
        await truncateCollections();
    })

    before(async () => {
        try {
            const connection: any = await getConnection();
            await Promise.all(collectionsNames.map(x => connection.createCollection(x)));
            console.log(`The following collections created: ${collectionsNames.join(',')}`);
        }
        catch (err) {
            console.log(`Database failure: ${err}`);
        }

    });

    after(async () => {
        try {
            const connection: any = await getConnection();
            connection.dropDatabase();
            console.log(`Database ${config.db.mongodb.server.substr(config.db.mongodb.server.lastIndexOf('/') + 1)} dropped`);
            // connection.close(); //close connection only once
        }
        catch (err) {
            console.log(`Database failure: ${err}`);
        }
    });
}

init();

export async function truncateCollections() {
    console.log('Removing all collections from db');
    connection = await getConnection();
    const names = (await connection.listCollections({}).toArray()).map((collection: any) => collection.name);
    if (names.length === 0) {
        console.log('No collections were found in db to remove');
        return;
    }
    try {
        await Promise.all(names.map((collectionName: any) => connection.collection(collectionName).drop()));
        console.log(`Removed all collections from db: ${names}`);
    }
    finally { }
}
