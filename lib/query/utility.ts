import * as _ from 'lodash';
import { Odm } from '../odm';
import { logger, Log, LogClass } from '../logger';

@LogClass(logger)
export class QueryUtility {
    /**  */
    @Log()
    public static convertObjectForUpdate(dataToUpdate) {
        const groupedByDollar = _.groupBy(_.map(dataToUpdate, (value, key) => {
            return { [key]: value };
        }), (obj) => {
            return Object.keys(obj)[0][0] === '$';
        });

        let convertedObject = {
            $set: new Object()
        };
        if (groupedByDollar.false) {
            groupedByDollar.false.forEach(nonDollarObject => Object.assign(convertedObject.$set, nonDollarObject));
        }
        if (groupedByDollar.true) {
            groupedByDollar.true.forEach(dollarObject => Object.assign(convertedObject, dollarObject));
        }
        return convertedObject;
    }
}
