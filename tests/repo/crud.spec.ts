import { expect } from 'chai';
import { Db, ObjectID } from 'mongodb';
import { truncateCollections, getConnection } from '../setup.spec';
import { Alert as AlertModel } from '../models/alert';
import { Case as CaseModel } from '../models/case';
import { Repo } from '../../lib/repo';

import { Query, DataChange } from '../../index';
const sinon = require('sinon');

describe('repo', () => {
    let connection: any;
    beforeEach(async () => {
        await truncateCollections();
        connection = await getConnection();
    });

    describe('test through model', () => {
        it('should save alert model to db', async () => {
            // given
            const alert = new AlertModel({});

            alert.id = '59e5cee88bb67a285c0454f6';
            alert.alert_title = 'my_title';

            // when 
            const saveResult = await alert.save();

            //then
            const alertFromDb = await connection.collection('Alert').findOne({});
            expect(alertFromDb).to.be.ok;
        });
        it('should get alert from db', async () => {
            // given
            await connection.collection('Alert').insertOne({
                _id: new ObjectID('59e5cee88bb67a285c0454f6'),
                alert_title: 'my_title'
            });

            // when 
            const alertFromDb = await AlertModel.get('59e5cee88bb67a285c0454f6');
            console.log(alertFromDb);

            // then
            expect(alertFromDb).to.be.ok;
        });

        it('should update alert in db', async () => {
            // given            
            let x = await connection.collection('Alert').insertOne({
                _id: new ObjectID('59e5cee88bb67a285c0454f6'),
                alert_title: 'my_title'
            });

            // when
            let updatedAlert = await AlertModel.update({ id: '59e5cee88bb67a285c0454f6' }, {
                'alert.title': 'updated_title',
                files: ['1']
            });

            // then
            const alertToValidate: AlertModel = await connection.collection('Alert').findOne({ _id: new ObjectID('59e5cee88bb67a285c0454f6') });
            expect(alertToValidate.alert_title).to.be.equal('updated_title');
        });

        it('should update case in db and emit correct data change', async () => {

            // given    

            const methodEventMock = {
                emit: (message: string, dataChange: any, serverType: any): any => {
                    return null;
                }
            }

            const emitSpy = sinon.spy(methodEventMock, 'emit');

            const moduleRepo = require('proxyquire-2').noCallThru().noPreserveCache().
                load('../../lib/repo/repo', {
                    '@tmla/methodus': {
                        'ServerType': {
                            RabbitMQ: 'amqp'
                        },
                        'MethodEvent': methodEventMock
                    }
                });
            const id = '59e5cee88bb67a285c0454f7';
            await connection.collection('Case').insertOne({
                _id: new ObjectID(id),
                title: 'case_old_title',
                editor_name: 'MOCK_USERNAME',
                files: ['1', '3']
            });
            const caseModel = new CaseModel({
                title: 'case_new_title',
                files: ['1']
            });
            (caseModel['odm'] as any).broadcastChanges = true;

            // when
            let updatedCase = await moduleRepo.Repo.update({ _id: new ObjectID(id) }, caseModel);

            // then
            const caseToValidate: CaseModel = await connection.collection('Case').findOne({ _id: new ObjectID(id) });
            expect(caseToValidate.title).to.be.equal('case_new_title');
            expect(updatedCase.title).to.be.equal('case_new_title');
            expect(caseToValidate.editor_name).to.be.equal('MOCK_USERNAME');
            expect(updatedCase.editor_name).to.be.equal('MOCK_USERNAME');
            expect(caseToValidate.files.length).to.be.equal(1);
            expect(caseToValidate.files[0]).to.be.equal('1');
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.new_value.value['title']).equal('case_new_title');
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.new_value.value['files'].length).equal(1);
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.old_value.value['title']).equal('case_old_title');
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.old_value.value['files'].length).equal(2);


        });


        xit('should replace case in db and emit correct data change', async () => {

            // given    

            const methodEventMock = {
                emit: (message: string, dataChange: any, serverType: any): any => {
                    return null;
                }
            }

            const emitSpy = sinon.spy(methodEventMock, 'emit');

            const moduleRepo = require('proxyquire-2').noCallThru().noPreserveCache().
                load('../../lib/repo/repo', {
                    '@tmla/methodus': {
                        'ServerType': {
                            RabbitMQ: 'amqp'
                        },
                        'MethodEvent': methodEventMock
                    }
                });
            const id = '59e5cee88bb67a285c0454f3';
            await connection.collection('Case').insertOne({
                _id: new ObjectID(id),
                title: 'case_old_title',
                files: ['1', '3'],
                field_to_delete: true
            });
            const caseModel = new CaseModel({
                title: 'case_new_title',
                files: ['1']
            });
            (caseModel['odm'] as any).broadcastChanges = true;

            // when
            let updatedCase = await moduleRepo.Repo.update({ _id: new ObjectID(id) }, caseModel, false, true);

            // then
            const caseToValidate: CaseModel = await connection.collection('Case').findOne({ _id: new ObjectID(id) });
            expect(caseToValidate.title).to.be.equal('case_new_title');
            expect(updatedCase.title).to.be.equal('case_new_title');
            expect(updatedCase['field_to_delete']).to.be.not.ok;
            expect(caseToValidate.files.length).to.be.equal(1);
            expect(caseToValidate.files[0]).to.be.equal('1');
            expect(caseToValidate['field_to_delete']).to.be.not.ok;
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.new_value.value['title']).equal('case_new_title');
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.new_value.value['files'].length).equal(1);
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.new_value.value['field_to_delete']).to.be.not.ok;
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.old_value.value['title']).equal('case_old_title');
            expect((emitSpy.getCall(0).args[1].changesData as DataChange)
                .value.old_value.value['files'].length).equal(2);


        });

        it('should remove alert from db', async () => {
            // given               
            let x = await connection.collection('Alert').insertOne({
                _id: new ObjectID('59e5cee88bb67a285c0454f6'),
                alert_title: 'my_title'
            });
            // when
            let deletedData = await AlertModel.delete({ id: new ObjectID('59e5cee88bb67a285c0454f6') }, AlertModel, true);
            // then
            expect(deletedData.result.ok).to.be.equal(1);
        });


        it('check duplicate match', async () => {
            // given               
            let x = await connection.collection('Alert').insertOne({
                _id: new ObjectID('59e5cee88bb67a285c0454f6'),
                alert_title: 'my_title'
            });
            // when            
            /*let predicate = new Query(AlertModel).
                filter({ id: '59e5cee88bb67a285c0454f6' }).
                filter({ id: '59e5cee88bb67a285c0454f6' });
                predicate = predicate;*/
            let predicate = new Query(AlertModel).
                filter({ id: '59e5cee88bb67a285c0454f6' })
                .order('weight', 'asc');
            console.log(JSON.stringify(predicate.toQuery()));
            // then
            //expect(deletedData.result.ok).to.be.equal(1);
        });
    });
});