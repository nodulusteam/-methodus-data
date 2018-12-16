import { Odm } from '../../lib/odm';
import { TransformDirection, Transform } from '../../index';
import * as path from 'path';
import { Query } from '../../lib/query';
import { Model, Field, Virtual, Lookup, ObjectId, IsoDate, Number } from '../../lib/decorators';
import { Repo } from '../../lib/repo/';

const expect = require('chai').expect;



@Model('Alert', Transform.Automatic, null, false)
class AlertModel extends Repo<AlertModel> {

    @ObjectId()
    @Field('id')
    public _id: string;

    @Field('_id')
    public id: string;

    @ObjectId()
    @Field('alert.title')
    public alert_title: string;

    @Number()
    @Field('alert.count_index')
    public alert_count_index: number;

    @Number()
    @Field('alert.count')
    public alert_count: number;
}






describe('test the odm', function () {

    it('transform string(number) value to number', async () => {
        const count = '8';
        const data: any =
            {
                "alert.count": count,
                "alert.count_index": count,
            };
        const returnData = await Repo.insert<AlertModel>(new AlertModel(data, AlertModel));
        expect(returnData['alert.count']).to.equal(+count);
        expect(returnData['alert.count_index']).to.equal(+count);
    });

    it('transform string(Text) value to number', async () => {
        const count = 'AAAA';
        const data: any =
            {
                "alert.count": count,
                "alert.count_index": count,
            };
        const returnData = await Repo.insert<AlertModel>(new AlertModel(data, AlertModel));
        expect(returnData['alert.count']).to.equal(count);
        expect(returnData['alert.count_index']).to.equal(count);
    });


    // it('transfrom in', async () => {

    //     const result = Odm.transform({
    //         _id: {
    //             displayName: 'id',
    //             propertyKey: '_id'
    //         },
    //         id: {
    //             displayName: '_id',
    //             propertyKey: 'id'
    //         }
    //     }, { _id: 'orel', id: 'some bson' }, TransformDirection.IN);
    //     expect(JSON.stringify(result)).to.equal(JSON.stringify({ _id: 'some bson', id: 'orel' }));
    // });

    // it('transfrom in - data inside array of results ', async () => {

    //     const result = Odm.transform({
    //         _id: {
    //             displayName: 'id',
    //             propertyKey: '_id'
    //         },
    //         id: {
    //             displayName: '_id',
    //             propertyKey: 'id'
    //         }
    //     }, [{
    //         results:
    //             [{ _id: 'orel', id: 'some bson1' },
    //             { _id: 'ron', id: 'some bson2' },
    //             { _id: 'roi', id: 'some bson3' }]
    //     }], TransformDirection.IN);

    //     expect(JSON.stringify(result)).
    //         to.equal(JSON.stringify([{
    //             results:
    //                 [{ _id: 'some bson1', id: 'orel' },
    //                 { _id: 'some bson2', id: 'ron' },
    //                 { _id: 'some bson3', id: 'roi' }]
    //         }]));
    // });

    // it('transfrom out', async () => {

    //     const result = Odm.transform({
    //         _id: {
    //             displayName: 'id',
    //             propertyKey: '_id'
    //         },
    //         id: {
    //             displayName: '_id',
    //             propertyKey: 'id'
    //         }
    //     }, { id: 'orel', _id: 'some bson' }, TransformDirection.OUT);
    //     expect(JSON.stringify(result)).to.equal(JSON.stringify({ id: 'some bson', _id: 'orel' }));
    // });

    // it('transfrom out - data inside array', async () => {

    //     const result = Odm.transform({
    //         _id: {
    //             displayName: 'id',
    //             propertyKey: '_id'
    //         },
    //         id: {
    //             displayName: '_id',
    //             propertyKey: 'id'
    //         }
    //     }, [{ id: 'orel', _id: 'some bson' },
    //     { _id: 'some bson2', id: 'ron' },
    //     { _id: 'some bson3', id: 'roi' }], TransformDirection.OUT);
    //     expect(JSON.stringify(result)).to.equal(JSON.stringify([{ id: 'some bson', _id: 'orel' },
    //     { _id: 'ron', id: 'some bson2' },
    //     { _id: 'roi', id: 'some bson3' }]));
    // });

});

