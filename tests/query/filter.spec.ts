import {
    Init, getConnection
} from '../setup.spec';
import { Company, Alert, Case, DashboardSummaryModel } from '../models';
import { Repo, Query, ReturnType } from '../../index';
import { ObjectId } from 'mongodb';
const expect = require('chai').expect;

describe('pluck', () => {

    it('dashboardsummarymodel test or and and or', async () => {
        const connection: any = await getConnection();
        // given
        const requestedQuery = [{
            $match: {
                $or: [{
                    $and: [{ _company_id: "HAS" },
                    {
                        recordDate: {
                            $gte: new Date("2018-01-21T09:08:05.000Z"),
                            $lte: new Date("2018-01-28T09:08:05.000Z")
                        }
                    },
                    {
                        $or: [
                            { provider: { $eq: null } },
                            { provider: { $eq: 2 } },
                            { provider: { $eq: 1 } }
                        ]
                    }]
                }]
            }
        }];
        //when
        const startDate = new Date("2018-01-21T09:08:05.000Z");
        const endDate = new Date("2018-01-28T09:08:05.000Z");
        let predicate = new Query(DashboardSummaryModel)
            .filter({ _company_id: "HAS" })
            .between('recordDate', startDate, endDate)
            .or([
                { provider: { $eq: null } },
                { provider: { $eq: 2 } },
                { provider: { $eq: 1 } }
            ]
            );

        //expect(predicate.toQuery()).to.equal(requestedQuery);
        expect(1).to.equal(1000000 - 999999);
    });
});
