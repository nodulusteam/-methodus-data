// tests/config.js
const path = require('path');
process.env.NODE_CONFIG_DIR = path.join(__dirname, '../', 'config');


var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
import { Query, } from '../../lib/query';
import { Model, Field, Virtual, Lookup, ObjectId, IsoDate } from '../../lib/decorators';
import { Transform, TransformDirection } from '../../lib/enums/';



process.env.TEST = 'true';
process.env.NODE_ENV = "debug";
process.env.NODE_CONFIG_ENV = "local";
process.env.NODE_LOG_DIR = "./logs";




@Model('Alert', Transform.Automatic)
class Alert {

    @ObjectId()
    @Field('id')
    public _id: string;

    @Field('_id')
    public id: string;


    @Field('alert.title')
    public alert_title: string;
}


describe('test the odm', function () {
    it('filter using ObjectID', function () {

        process.env.NODE_CONFIG_DIR = path.join(__dirname, '../', 'env');


        process.env.TEST = 'true';
        process.env.NODE_ENV = "debug";
        process.env.NODE_CONFIG_ENV = "local";
        process.env.NODE_LOG_DIR = "./logs";


        let query = new Query(Alert).filter({ 'id': '596e16f5bfdc9dbe27c41398' });

        let matchObject = JSON.stringify([{ "$match": { "$and": [{ "_id": "596e16f5bfdc9dbe27c41398" }] } }]);
        expect(JSON.stringify(query.toQuery())).to.equal(matchObject);
    });
});
