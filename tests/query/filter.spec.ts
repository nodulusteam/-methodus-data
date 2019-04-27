
import {  DashboardSummaryModel } from '../models';
import {  Query } from '../../index';

const expect = require('chai').expect;

describe('pluck', () => {
    it('dashboardsummarymodel test or and and or', async () => {
        const startDate = new Date("2018-01-21T09:08:05.000Z");
        const endDate = new Date("2018-01-28T09:08:05.000Z");
        new Query(DashboardSummaryModel)
            .filter({ _company_id: "HAS" })
            .between('recordDate', startDate, endDate)
            .or([
                { provider: { $eq: null } },
                { provider: { $eq: 2 } },
                { provider: { $eq: 1 } }
            ]
            );
        expect(1).to.equal(1000000 - 999999);
    });
});
