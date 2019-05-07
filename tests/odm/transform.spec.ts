
import {
     Transform, Repo,
    Model, Field, ObjectId,  Number
} from '../../lib';

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
});

