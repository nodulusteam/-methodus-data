'use strict';

module.exports = {
    connections:
        {
            default: {
                server: 'mongodb://127.0.0.1:27017',
                //server: 'mongodb://127.0.0.1:27017,localhost:27018/myproject?replicaSet=foo',
                db: 'tmlatest',
                user: 'user',
                password: '1234',
                pem: '/opt/app/seta/cet.pem',
                //replicaSet: 'tmla',
                poolSize: 10,
                ssl: false,
                exchanges: ['event-bus', 'cache-bus']
            },
            alert: {
                server: 'mongodb://127.0.0.1:27017',
                db: 'tmlatest',
                user: 'user',
                password: '1234',
                pem: '/opt/app/seta/cet.pem',
                //replicaSet: 'tmla',
                poolSize: 10,
                ssl: false,
                exchanges: ['event-bus', 'cache-bus']
            },
            case: {
                server: 'mongodb://127.0.0.1:27017',
                db: 'tmlatest',
                user: 'user',
                password: '1234',
                pem: '/opt/app/seta/cet.pem',
                //replicaSet: 'tmla',
                poolSize: 10,
                ssl: false,
                exchanges: ['event-bus', 'cache-bus']
            }

        },
    db: {
        servers: [
            { db: 'seta2', host: '192.168.99.100', user: 'admin', password: '123456' }

        ],
        mongoServer: 'mongodb://localhost:27017/tmlatest',
        mongoPoolSizePerConnection: 10,
        mongo: {
            server: 'mongodb://127.0.0.1:27017',
            db: 'tmlatest',
            user: 'user',
            password: '1234',
            pem: '/opt/app/seta/cet.pem',
            exchanges: ['event-bus', 'cache-bus']
        }
    },
    app: {
        title: 'LocalDev - AT&T Threat Manager: Log Analysis',
        static_user_id: '061b8c74-033d-4128-b298-a863a178d5c1'
    },
    services: {
        seta_consumer: {
            host: '135.213.190.107',
            port: 8778
        }
    },
    reconfigure:
        {
            shards: 1,
            replicas: { 'default': 3 },
            primaryReplicaTag: 'default'
        },
    logs: {

    },
    port: 3030,
    security: { whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '::1'] }


};
