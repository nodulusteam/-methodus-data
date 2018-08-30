import * as mongo from 'mongodb';
import { Db, ReadPreference } from 'mongodb';
import { logger, Log, LogClass, } from './logger';




const bluebird = require('bluebird');
bluebird.promisifyAll(require('mongodb'));


export class DBHandler {
    public static connections: Map<string, mongo.Db> = new Map<string, mongo.Db>();
    private static connectionsPromises: Map<string, Promise<mongo.Db>> = new Map<string, Promise<mongo.Db>>();
    private static connectionPools: any = {};
    public static config: any;
    constructor() {

    }


    public static async getConnection(connectionName: string = 'default'): Promise<mongo.Db> {
        if (!DBHandler.connectionPools)
            DBHandler.connectionPools = {};


        if (!DBHandler.connectionPools[connectionName]) {
            const factory = {
                create: function (config) {
                    if (!DBHandler.connectionsPromises)
                        DBHandler.connectionsPromises = new Map<string, Promise<mongo.Db>>();

                    if (!DBHandler.connectionsPromises[connectionName]) {
                        DBHandler.connectionsPromises[connectionName] = DBHandler.initConnection(config, connectionName);
                    }

                },
                acquire: async function () {
                    return await DBHandler.connectionsPromises[connectionName];
                },
                destroy: function (client) {
                    client.disconnect();
                }
            };

            factory.create(this.config);
            DBHandler.connectionPools[connectionName] = factory;
        }


        const connection = await DBHandler.connectionPools[connectionName].acquire();

        return connection;
    }


    public static async initConnection(config, connectionName?: string) {
        return new Promise((resolve, reject) => {

            let dbAddress = '';
            if (!connectionName) {
                connectionName = 'default';
            }

            if (config.connections && config.connections[connectionName]) {
                dbAddress = `${config.connections[connectionName].server}/${config.connections[connectionName].db}`;
                const options: any = this.getDbOptions(config.connections[connectionName]);
                options.useNewUrlParser = true;
                logger.info(this, `initiating DB connection to: ${dbAddress}`, options);
                mongo.MongoClient.connect(dbAddress,
                    options
                    , (err, client) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(client.db(config.connections[connectionName].db));
                        }
                    });
            } else {
                throw (new Error(`
                    Missing connections block or a default connection. 
                    Please refer to https://wiki.web.att.com/pages/viewpage.action?pageId=621156341 for further explanation.
                    `));
            }
        });

    }


    public closeConnection(): void {
        DBHandler.connections.forEach((connection: any, connectionName: string) => {
            connection.close();
            DBHandler.connections.delete(connectionName);
        });
    }

    private static getDbOptions(connection: any): {} {
        let dbOptions: {} = {};
        const defaultOptions = [
            { poolSize: 10 },
            { replicaSet: 'tmla' },
            { ssl: true },
            { readPreference: ReadPreference.PRIMARY_PREFERRED },
            { user: undefined },
            { password: undefined }
        ];


        defaultOptions.forEach((option) => {
            const key = Object.keys(option)[0];
            if (connection[key] !== undefined) {
                dbOptions[key] = connection[key];
            }

            if (dbOptions[key] === undefined) {
                delete dbOptions[key];
            }
        });
        return dbOptions;
    }
}

