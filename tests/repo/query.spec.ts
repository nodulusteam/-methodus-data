// tests/config.js
const path = require('path');
import { Repo, Query, ReturnType, QueryFragment } from '../../lib/';
import { Alert, User, Company, UserRole } from '../models/index';
import { getConnection } from '../setup.spec';
import * as _ from 'lodash';

var chai = require('chai');
var expect = chai.expect; // we are using the 'expect' style of Chai

import { ObjectID } from 'mongodb'


function getAlerts() {
    return [
        { _company_id: 'HAS', created_at: new Date('11-12-17'), severity: 'information', rules_date: true, case_id: '111621020' },
        { _company_id: 'HAS', created_at: new Date('11-10-17'), severity: 'low', case_id: '22388' },
        { _company_id: 'POC', created_at: new Date('15-09-17'), severity: 'information', rules_date: false },
        { _company_id: 'HAS', created_at: new Date('18-07-17'), severity: 'low', rules_date: true },
        { _company_id: 'POC', created_at: new Date('03-11-17'), severity: 'critical', case_id: '111621020', rules_date: true }
    ];
}

function getUserData() {
    return {
        created_at: new Date('Tue Jul 26 2016 08: 26: 39 GMT+00: 00'),
        created_by: 'system',
        id: '2a5a6f08-f5fc-4e6a-853b-0040c541d8e1',
        level: 'internal',
        name: 'ATT Admin',
        order: '1',
        role: 'admin'
    };
}

async function insertAlert() {
    const connection: any = await getConnection();
    await connection.collection('Alert').insert({
        _id: new ObjectID('59800620deb9ae257cb3c830'),
        _company_id: 'HAS',
        created_at: new Date(),
        severity: 'low'
    });

}

describe('getUsersToInform', () => {
    xit('getUsersToInform', async () => {
        const connection: any = await getConnection();
        let id1 = new ObjectID();
        let id2 = new ObjectID();
        let id3 = new ObjectID();
        let id4 = new ObjectID();

        await connection.collection('UserRole').insertMany([Object.assign({}, { _id: id1 }, getUserData()),
        Object.assign({}, { _id: id2 }, getUserData()),
        Object.assign({}, { _id: id3 }, getUserData()),
        Object.assign({}, { _id: id4 }, getUserData())]);

        await connection.collection('User').insertOne({
            _id: new ObjectID(),
            '_companies': [],
            '_company_id': 'POC',
            'address': 'Address',
            'title': 'ron',
            'attUID': 'xxxx',
            'company_id': 'FFF',
            'created_at': '2017-11-13T13:43:51.089Z',
            'created_by': 'SYSTEM',
            'daily_digest': false,
            'dashboard_id': '9af2d779-70c0-4e21-917e-057e007f8dc9',
            'disableNotification': false,
            'email': 'hr073v@intl.att.com',
            'first_name': 'HADAS',
            'id': '9af2d779-70c0-4e21-917e-057e007f8dc9',
            'isExternal': false,
            'last_name': 'AGASSI RODAL',
            'middle_name': '',
            'newCase_notifications': {
                'case_severities': [
                    'medium'
                ]
            },
            'primary_phone': '000000000000',
            'role_id': '1111111111111111',
            'security_exception': [],
            'status': true,
            'text_number': {
                'number': null,
                'type': 'primary'
            },
            'updateCase_notifications': {
                'case_severities': [
                    'medium'
                ]
            },
            'username': 'HADAS AGASSI RODAL',
            'zip': '12345'
        });


        let roles = await new Query(UserRole).run();
        let rolesResult: any = {};
        roles.forEach((role: any) => {
            rolesResult[role.level] = rolesResult[role.level] || [];
            rolesResult[role.level].push(role._id);
        });
        //roles = _.map(roles, '_id');

        const internalQuery = QueryFragment({ 'title': 'ron' });//.or({ 'title': 'cox' });
        const externalQuery = QueryFragment({ role_id: { $in: rolesResult.external } });//.and({ _company_id: 'POC' });
        const thirdQuery = QueryFragment({ 'status': true });
        let xFrag = internalQuery.or(externalQuery.and(thirdQuery));

        let query = new Query(User)
            //.exists('email')
            //.in('newCase_notifications.case_severities', ['medium'])

            .filter(xFrag);
        let result = await query.run();
        expect(result.length).to.be.equal(2);
    });
})

describe('create a simple query to access mongo collection', () => {
    it('get document by primary key', async () => {
        await insertAlert();

        let result: Alert = await Alert.get('59800620deb9ae257cb3c830');
        expect(result.id.toString()).to.equal('59800620deb9ae257cb3c830');
    });

    it('filter by id to be an object', async (done) => {
        await insertAlert();
        let predicate = new Query(Alert).filter({ id: '59800620deb9ae257cb3c830' });
        let result = await predicate.run(ReturnType.Single);
        expect(result).to.be.a('object');

        done();


    });

    it('filter by id to be an array', async () => {
        await insertAlert();
        let predicate = new Query(Alert).filter({ _id: '59800620deb9ae257cb3c830' });
        let result = await predicate.run();
        expect(result).to.be.a('array');
    });
});

describe('create a simple query to access mongo collection', () => {

    it('filter by _company_id,paging count 3 results', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);
        let query = new Query(Alert).filter({ '_company_id': 'HAS' }).paging(1, 5);
        let result = await Repo.query(query);
        expect(result.results.length).to.equal(3);
    });


    it('paging count 5 results', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).order('created_at', 'asc').paging(1, 5);
        let result = await Repo.query(query);
        expect(result.results.length).to.equal(5);
        // expect(result.results[0].created_at.toString()).to.equal(new Date('05-06-16').toString());
    });

    it('group results by severity(low,critical,information,medium,high)', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).group({ _id: '$severity', total: { $sum: 1 } });
        let result = await Repo.query(query);
        expect(result.filter((alert: any) => alert.id === 'low').pop().total).to.be.equal(2);
    });

    it('filter,pluck,without', async () => {
        const alerts = [
            { _company_id: 'HAS', created_at: new Date('11-12-17'), severity: 'high', name: 'test1' },
            { _company_id: 'HAS', created_at: new Date('11-10-17'), severity: 'low', name: 'test2' }
        ];
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).filter({ created_at: new Date('11-10-17') }).pluck('severity', 'created_at').without('name');

        let result = await Repo.query(query);

        expect(result.length).to.equal(1);
        expect(result[0].hasOwnProperty('severity')).to.equal(true);
        expect(result[0].hasOwnProperty('created_at')).to.equal(true);
        expect(result[0].hasOwnProperty('name')).to.equal(false);
    });

    it('merge', async () => {
        const connection: any = await getConnection();
        await Promise.all([
            connection.collection('Company').insertMany([{ _id: 'Maxim', id: 'Maxim' }, { _id: 'POC', id: 'POC' }]),
            connection.collection('User').insertMany([
                { id: 'some id', name: 'Orel', company_id: 'Maxim', _companies: [{ id: 'HAS' }, { id: 'POC' }] },
                { id: 'some id1', name: 'Ron', company_id: 'POC', _companies: [{ id: 'HAS' }, { id: 'Maxim' }] },
                { id: 'some id1', name: 'Pablo', company_id: 'POC', _companies: [{ id: 'HAS' }, { id: 'FAKE' }] },
                { id: 'some id2', name: 'Moshe', company_id: 'Maxim', _companies: [{ id: 'HAS' }, { id: 'FAKE' }] }
            ])
        ]);

        let query = new Query(Company).filter({ 'id': 'Maxim' })
            .merge('User', '_id', 'company_id', 'users') // $lookup => join user.company_id = company._id
            .merge('User', 'id', '_companies.id', 'users_addition')
            .addFields([{ 'irit': '$users_addition' }]);

        let result = await Repo.query(query);
        expect(result.length).to.equal(1);
        expect(result[0].users.length).to.equal(2);
        expect(result[0].users.filter((user: any) => user.name === 'Pablo').length).to.equal(0);
        expect(result[0].users_addition.length).to.equal(1);
        expect(result[0].users_addition[0].name).to.equal('Ron');
    });

    it('exists', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).filter({ 'severity': 'critical' }).exists('case_id').paging(1, 5);
        let result = await Repo.query(query);
        expect(result.results.length).to.equal(1);
    });

    it('not exists', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).filter({ 'severity': 'information' }).notExists('case_id').paging(1, 2);
        let result = await Repo.query(query);
        expect(result.results.length).to.equal(1);
    });

    it('combineNotExistWithExist', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).notExists('case_id').exists('rules_date');
        let result = await Repo.query(query);
        expect(result.length).to.equal(2);
    });

    it('between', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);
        const query = new Query(Alert)
            .between('_id', '100020011', '100030011')
            .and({
                'severity': 'critical'
            }).or({
                'severity': 'medium'
            }).paging(1, 5);
        const result = await Repo.query(query);
        expect(result.results.length).to.equal(0);
    });

    it('combineExistWithNotExist', async () => {
        const alerts = getAlerts();
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);
        let query = new Query(Alert).exists('case_id').notExists('rules_date').paging(1, 5);
        let result = await Repo.query(query);
        expect(result.results.length).to.equal(1);
    });

    it('filter by _company_id, count check', async () => {
        const alerts = getAlerts();

        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).filter({ 'case_id': '111621020' }).count('total_alerts');
        let result = await Repo.query(query, ReturnType.Single);
        expect(result.total_alerts).to.equal(2);
    });

    it('filter by _company_id, limit check', async () => {
        const alerts = getAlerts();

        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).filter({ 'case_id': '111621020' }).limit(2);
        let result = await Repo.query(query);
        expect(result.length).to.equal(2);
    });

    it('empty filter check', async () => {
        const alerts = [{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }, { name: '6' }];
        const connection: any = await getConnection();
        await connection.collection('Alert').insertMany(alerts);

        let query = new Query(Alert).filter({}).limit(4);
        let result = await Repo.query(query);
        expect(result.length).to.equal(4);
    });

});
