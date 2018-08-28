'use strict';
var _ = require('lodash');
   
//const debug = require('debug')('tmla:data:filter');
import { ObjectID } from 'mongodb';
import { Query } from '../query/';
import { Odm } from '../odm';
import { TransformDirection } from '../enums/';
import { logger, Log, LogClass } from '../logger';
const escapeRegExp = require('escape-string-regexp');

export interface ITimeObject {
    startTime: Date;
    endTime: Date;
}




@LogClass(logger)
export class FilterServerUtility {
    private emptyObjectString: any = JSON.stringify({});
    private model: any;


    public handleODM(filter: any) {
        //let cloneFilter = JSON.parse(JSON.stringify(filter));
        let cloneFilter = filter;
        let propertyKey = filter.filter_by;
        if (!propertyKey) {
            try {
                propertyKey = Object.keys(cloneFilter)[0];
            } catch (err) {

            }
        }
        if (this.model && this.model.odm) {
            if (this.model.odm[propertyKey]) {
                if (this.model.odm[propertyKey].identifier === 'objectid') {
                    FilterServerUtility.singleOrArray(cloneFilter, ObjectID, propertyKey);
                }
                else if (this.model.odm[propertyKey].type === 'number') {
                    FilterServerUtility.singleOrArray(cloneFilter, Odm.parseToNumber, propertyKey);
                }
            }

            let foundDefinition = this.findInOdm(this.model.odm, propertyKey);
            if (foundDefinition) {
                filter.filter_by = foundDefinition.propertyKey;
            }
        }
        return cloneFilter;
    }


    findInOdm(odm: any, find: any) {
        for (let field in odm) {
            if (odm[field].displayName && odm[field].displayName === find)
                return odm[field];
        }
    }


    public static singleOrArray(filter: any, func: Function, propertyKey: string) {
        let keys = Object.keys(filter[propertyKey]);
        if (propertyKey.indexOf('$') === 0 && keys && keys.length > 0) {
            keys.forEach((key) => {
                filter[propertyKey][key] = this.singleOrArrayValue(filter[propertyKey][key], func, propertyKey);
            });
        } else if (filter.value) {
            filter.value = this.singleOrArrayValue(filter.value, func, propertyKey);
        } else {
            filter[propertyKey] = this.singleOrArrayValue(filter[propertyKey], func, propertyKey);
        }
        logger.debug('singleOrArray  filter[propertyKey]', JSON.stringify(filter[propertyKey]));
    }

    public static singleOrArrayValue(current: any, func: any, propertyKey: any): any {
        let returnValue = {};
        if (Array.isArray(current)) {
            returnValue = current.map((curr) => {
                return func(curr);
            });
        } else {
            if (typeof current === 'object' && Object.keys(current).length > 0) {
                returnValue = Object.keys(current).map((key: any) => {
                    if (Array.isArray(current[key])) {
                        current[key] = current[key].map((item: any) => {
                            return func(item);
                        });
                    }
                    else {
                        current[key] = func(current[key]);
                    }
                    return current;
                });
            }
            else {
                returnValue = func(current);
            }
        }
        logger.debug('singleOrArrayValue  returnValue', JSON.stringify(returnValue));
        return Array.isArray(returnValue) ? returnValue[0] : returnValue;
    }

    private filterTree: any = {
        'during': (filter: any) => {
            let timeObject: ITimeObject = this.buildTimeObject(filter);
            return {
                [filter.filter_by]: {
                    $gte: timeObject.startTime,
                    $lte: timeObject.endTime
                }
            };
        },
        'hasFields': (filter: any) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$exists': true
            };
            return obj;
        },
        'hasFields_not': (filter: any) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$exists': false
            };
            return obj;
        },
        'gt': (filter: any) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$gt': filter.value
            };
            return obj;
        },
        'gte': (filter: any) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$gte': filter.value
            };
            return obj;
        },
        'lt': (filter: any) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$lt': filter.value
            };
            return obj;
        },
        'lte': (filter: any) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$lte': filter.value
            };
            return obj;
        },

        'match': (filter) => {
            return {
                [filter['filter_by']]: {
                    '$in': [new RegExp(escapeRegExp(filter.value), 'i')]
                }
            };
        },
        'not_match': (filter) => {
            return {
                [filter['filter_by']]: {
                    '$nin': [new RegExp(escapeRegExp(filter.value), 'i')]
                }
            };
        },

        'include': (filter) => {
            return {
                [filter['filter_by']]: {
                    '$in': [new RegExp(escapeRegExp(filter.value), 'i')]
                }
            };
        },
        'not_include': (filter) => {
            return {
                [filter['filter_by']]: {
                    '$nin': [new RegExp(escapeRegExp(filter.value), 'i')]
                }
            };
        },


        'ne': (filter) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$ne': filter.value
            };
            return obj;
        },
        'eq': (filter) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$eq': filter.value
            };
            return obj;
        },
        'default': (filter) => {
            let obj = {};
            obj[filter['filter_by']] = {
                '$eq': filter.value
            };
            return obj;
        }
    };

    constructor(instance: any) {
        this.model = instance;
    }

 

    @Log()
    public build(queryFilters?, query?, literal?): any { //literal is a patch for when we use fields like 'alert.title' and need to treat it as a flat property

        let filters = [],
            sortObject = [],
            filter;
        if (queryFilters && queryFilters.filters && Array.isArray(queryFilters.filters)) {
            queryFilters = queryFilters.filters;
        }
        if (Array.isArray(queryFilters)) {
            for (let i = 0; i < queryFilters.length; i++) {
                if (typeof queryFilters[i] === 'string') {
                    filter = JSON.parse(queryFilters[i]);
                } else {
                    filter = queryFilters[i];
                }
                //

                //Check to make sure filter object is not empty
                if (Object.keys(filter).length !== 0 && filter !== JSON.stringify({}) && !filter.order_by /*&& (filter.filter || filter.nested)*/) {
                    /*if (filter.filter === 'during') {
                        filter.value = this.getDateDuring(filter.value);
                    }*/
                    filters.push(filter);
                } else if (Object.keys(filter).length !== 0 && filter !== JSON.stringify({}) && filter.order_by) {
                    if (filter.filter) { // split filters into sort,filter.
                        const newFilter = Object.assign({}, filter);
                        delete newFilter.order_by;
                        delete newFilter.sort;
                        filters.push(newFilter);
                    }
                    sortObject.push({ order_by: filter.order_by, sort: filter.sort });
                }
            }
        } else {
            //TODO check to make sure JSON.parse will work
            if (typeof queryFilters === 'string') {
                filter = JSON.parse(queryFilters);
            } else {
                filter = queryFilters;
            }
            if (filter && Object.keys(filter).length !== 0 && filter !== JSON.stringify({})) {
                if (Array.isArray(filter)) {
                    Object.assign(filters, filter);
                } else {
                    filters.push(filter);
                }
            }
        }

        if (filters.length > 0 || sortObject.length > 0) {
            let fixedFilters = filters.filter(function (filter) {
                if (filter.value !== null && typeof filter.value !== 'undefined') {
                    let valueAsString = filter.value.toString();
                    return valueAsString !== '';
                }
                else {
                    if ((filter && typeof filter !== 'undefined') || Object.keys(filter).length > 0) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            });

            return this.makeFilterFunction(fixedFilters, literal, sortObject);
        } else {
            return {};
        }

    }

    private buildTimeObject(duringer: any): ITimeObject {

        return {
            startTime: new Date(duringer.value.start),
            endTime: new Date(duringer.value.end)
        }
    }


    private makeFilterFunction(filters: any, literal: any, sortObject?: any): any {
        let predicates = [],
            predicate,
            filterFunction,
            i;

        for (i = 0; i < filters.length; i++) {
            if (filters[i].filter_by) {

                //convert the filter property name using the transformation
                const convertedFilter = Odm.transform(this.model.odm, { [filters[i].filter_by]: filters[i].value }, TransformDirection.IN);
                if (convertedFilter && Object.keys(convertedFilter).length > 0) {
                    filters[i].filter_by = Object.keys(convertedFilter)[0];
                    filters[i].value = convertedFilter[filters[i].filter_by];
                }

                filters[i].literal = literal;

                const tempFilter = this.model.odm.fields[filters[i].filter_by];
                if ((tempFilter && tempFilter.type === 'Number') && !isNaN(filters[i].value)) {
                    filters[i].value = filters[i].value * 1;
                }

                predicate = this.makePredicate(filters[i])(this.handleODM(filters[i]));

            } else if (filters[i].nested) {
                predicate = this.makeFilterFunction(filters[i].nested, literal);
                
            } else if (typeof filters[i] === 'object') {
                predicate = this.handleODM(filters[i]);
            }
            filters[i].predicate = predicate;

            if (predicate) {
                predicates.push(predicate);
            }
            predicate = null;

        }

        filterFunction = filters && filters[0] ? filters[0] : null;
        let obj = {};
        let activeProperty;
        if (filterFunction) {
            switch (filterFunction.logic) {
                case 'or':
                    obj['$or'] = [];
                    activeProperty = '$or';
                    break;
                case 'and':
                    obj['$and'] = [];
                    activeProperty = '$and';
                    break;
                default:
                    obj['$and'] = [];
                    activeProperty = '$and';

            }
        }

        if (filters.length > 0) {
            for (let x = 0; x < filters.length; x++) {
                let currentPredicate = filters[x].predicate;
                if (currentPredicate.predicate) {
                    delete currentPredicate.predicate;
                }
                obj[activeProperty].push(currentPredicate);
            }
        }
        if (sortObject && sortObject.length > 0) {
            obj['$sort'] = sortObject;
        }
        logger.debug('makeFilterFunction  obj', JSON.stringify(obj));
        return obj;
    }



    private getDateDuring(value: any) {
        let start = new Date(value.start);
        let end = new Date(value.end);
        return { 'start': start, 'end': end };
    }

    private makePredicate(filter: any): any {
        let predicate;
        let filterName = filter.filter + ((filter.logic) ? '_' + filter.logic : '');
        let filterTreeNode = this.filterTree[filter.filter] || this.filterTree['default'];
        if (filter.logic)
            filterTreeNode.logic = filter.logic;
        return filterTreeNode;
    }

    private handleTimeRange(query: any) {
        let duringer = null;
        //we build the filters in order to find a date filter, if it exists we will use a date index for the base predicate

        let filtersList = [],
            filter;
        let queryFilters = query.filters;
        if (typeof queryFilters === 'string') {
            queryFilters = JSON.parse(queryFilters);
        }

        if (Array.isArray(queryFilters)) {
            for (let i = 0; i < queryFilters.length; i++) {
                //filter = JSON.parse(query.filters[i]);
                //Check to make sure filter object is not empty
                if (typeof queryFilters[i] === 'string') {
                    filter = JSON.parse(queryFilters[i]);
                } else {
                    filter = queryFilters[i];
                }
                if (Object.keys(filter).length !== 0 && JSON.stringify(filter) !== JSON.stringify({})) {
                    filtersList.push(filter);
                }
            }
        } else {
            //TODO check to make sure JSON.parse will work
            filter = queryFilters;

            if (Object.keys(filter).length !== 0 && filter !== JSON.stringify({})) {
                filtersList.push(filter);
            }
        }
        duringer = _.head(_.filter(filtersList, {
            'filter': 'during'
        }));

        if (duringer) {

            let sortFromFilter = _.head(_.filter(filtersList, {
                'sort': 'desc'
            }));
            if (sortFromFilter) {
                duringer.sort = sortFromFilter.sort;
            } else {
                duringer.sort = query.sort === 'desc' ? 'desc' : 'asc';
            }

        }

        return duringer;
    }

 

  

    private prepareSingleCompany(options: any): Query {
        return new Query(this.model || options.tableName).filter({
            [options['index']]: options.company_crit[0]
        });
    }
    /**matching multiple company for example,
     * [{"$match":{"$and":[{"id":{"$in":["POC","Maxim","IRIT","HAS","Gamma","GOD"]}}]
     */



    private prepareMultiCompany(options: any) {
        return new Query(this.model || options.tableName).filter({
            [options['index']]: {
                $in: options.company_crit
            }
        });
    }
    /**
     *
     * return empty query, all customers, we want all company results.
     */


    private prepareAllCompany(options: any) {
        return new Query(this.model || options.tableName);
    }
}
