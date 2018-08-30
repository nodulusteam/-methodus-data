import { ChangesEvent } from './';
import { FilterServerUtility } from '../filter/';
import { DBHandler } from '../connect';
import { Query } from '../query/query';
import { Odm, getOdm } from '../odm';
import { ODM } from '../odm-models';
import { Direction, ReturnType, TransformDirection, Transform } from '../enums/';
import { logger } from '../logger';
import { ObjectID } from 'mongodb';
import { MethodEvent, ServerType, SecurityContext } from '@methodus/server';
import { DataChangeEvent, DataChange } from '../changes';
import * as _ from 'lodash';





export abstract class Repo<T> /*implements IRepo*/ {
    private dataArray: any;
    private odm: Odm;
    private modelType: any;


    constructor(data?: {} | Array<{}>, modelType?: any) {
        /**
         * copy constructor
         */
        if (modelType)
            this.modelType = modelType;

        if (!data) {
            return;
        }
        if (Array.isArray(data)) {
            this.dataArray = data;
        }
        else {
            Object.keys(data).forEach((key) => {
                this[key] = data[key];
            });
        }

        this.odm = getOdm(modelType);
        if (!this.odm)
            throw (new Error('class model information is missing, are you using a data model?'))
    }

    private static cleanOdm(data) {
        delete data['odm'];
        delete data['modelType'];
        return data;
    }
    /**
     * get connection from the database
     */
    public async getConnection(connectionName: string): Promise<any> {
        return await DBHandler.getConnection(connectionName);
    }

    /**
     *
     * @param odm  - decleare the properties of the class and collection name
     * @param data - data to trasnform into the database, for example => alert.title = alert_title.
     */

    private static transformIn(odm: ODM, data) {
        if (odm && odm.transform === Transform.Automatic) {
            data = Odm.transform(odm, data, TransformDirection.IN);
        }

        return data;
    }
    /**
     *
     * @param odm - decleare the properties of the class and collection name
     * @param data - data to trasnform out from the database, for example => alert_title = alert.title.
     */

    private static transformOut(odm: ODM, data) {
        if ((odm && odm.transform === Transform.Automatic) && data) {
            data = Odm.transform(odm, data, TransformDirection.OUT);
        }
        return data;
    }
    /**
     *
     * @param odm - decleare the properties of the class and collection name
     * @param data - data to save into collection
     * @param dbConnection - connection to database
     */

    private static async _save(odm: ODM, data, dbConnection: any) {
        data = this.transformIn(odm, data);
        data = this.cleanOdm(data);

        let result = await dbConnection.collection(odm.collectionName).save(data, { upsert: true });

        if (Array.isArray(data)) {
            const dataArray = [data].
                reduce((acc, v) => acc.concat(v), new Array()).
                map((d, i) => Object.assign({ _id: result.result.upserted[i] }, d));
            if (dataArray.length > 0) {
                result = this.transformOut(odm, dataArray);
            }
        } else {
            result = this.transformOut(odm, data);
        }
        // if (odm.broadcastChanges) {
        //     const insertedRecordWithId = Object.assign({ id: result.id }, result);
        //     MethodEvent.emit('create::' + odm.collectionName,
        //         new DataChangeEvent(odm.collectionName, null, insertedRecordWithId), ServerType.RabbitMQ, this.getExchanges(odm));
        // }
        return Array.isArray(result) && result.length === 1 ? result[0] : result;
    }

    private static getExchanges(odm) {

        return null;
    }
    /**
    *
    * @param odm - decleare the properties of the class and collection name
    * @param data - data to save into collection
    * @param dbConnection - connection to database
    */

    private static async _insert(odm: ODM, data: {} | Array<{}>, dbConnection: any): Promise<{} | Array<{}>> {
        data = this.transformIn(odm, data);
        data = this.cleanOdm(data);

        let result = await dbConnection.collection(odm.collectionName).insert(data);
        result = this.transformOut(odm, result.ops);

        const inserted = Array.isArray(result) && result.length === 1 ? result[0] : result;
        // if (odm.broadcastChanges) {
        //     MethodEvent.emit('create::' + odm.collectionName,
        //         new DataChangeEvent(odm.collectionName, null, inserted), ServerType.RabbitMQ, this.getExchanges(odm));

        // }
        return inserted;
    }

    /**
     *
     * @param data - data to insert to database,
     */

    public static async save<T>(data: {}) {
        let odm = getOdm<T>(data) || this['odm'] as ODM;
        let connection = await DBHandler.getConnection(odm.connectionName);
        return await Repo._save(odm, data, connection);
    }

    public async save() {
        let odm = getOdm<T>(this);
        return await Repo._save(odm, this, await this.getConnection(odm.connectionName));
    }
    /**
     *
     * @param data - data to insert to database
     */

    public static async insert<T>(data: T | Array<T>) {
        let odm = getOdm<T>(data) || this['odm'] as ODM;
        let connection = await DBHandler.getConnection(odm.connectionName);
        return await Repo._insert(odm, data, connection) as T;
    }

    public async insert() {
        let odm = getOdm<T>(this);
        const data = this.dataArray || this;
        const connection = await this.getConnection(odm.connectionName);
        return await Repo._insert(odm, data, connection);
    }

    /**
     *
     * @param _id - get document by id
     */

    public static async get(_id: string) {
        let odm: ODM = getOdm(this)
        let connection = await DBHandler.getConnection(odm.connectionName);
        let result = null;
        result = await connection.collection(odm.collectionName).findOne(Odm.applyObjectID(_id) as any);
        result = this.transformOut(odm, result);
        return result;
    }

    private static cleanIdForMongo<T>(updateData: T) {
        //let odm: ODM = getOdm<T>(updateData) || this['odm'] as ODM;
        let updateDataId: string = updateData['id'] || updateData['_id'];
        delete updateData['id'];
        delete updateData['_id'];
        return updateDataId;
    }

    /** merge object and extend array values */
    private static smartMerge(oldValue, newValue) {
        const oldValueCloned = _.extend({}, oldValue)
        return _.mergeWith(oldValueCloned, newValue, function customizer(objValue, srcValue) {
            if (_.isArray(objValue) && _.isArray(srcValue)) {
                return srcValue;
            }
        });
    }


    public static async update<T>(filter: any, dataToUpdate: T, _upsert: boolean = false, replace: boolean = false) {
        //get odm and clean it from dataToUpdate
        let odm: ODM = getOdm<T>(dataToUpdate) || this['odm'] as ODM;
        this.cleanOdm(dataToUpdate);

        //transform in filter and dataToUpdate objects
        const filterTransformed = this.transformIn(odm, filter);


        //make operation in db (update or replace)        
        let connection = await DBHandler.getConnection(odm.connectionName);

        let originalObject = await connection.collection(odm.collectionName)
            .find(filterTransformed).toArray();
        if (originalObject.length > 0) {
            originalObject = this.transformOut(odm, originalObject[0]);
        }


        const finalResult = replace ? dataToUpdate : this.smartMerge(originalObject, dataToUpdate);


        const dataToUpdateTransformed = this.transformIn(odm, finalResult);

        const recordBefore = await connection.collection(odm.collectionName)
            .findOneAndUpdate(filterTransformed,
                replace ? dataToUpdateTransformed : { $set: dataToUpdateTransformed },
                {
                    returnOriginal: true,
                    upsert: _upsert
                });

        // proccess data after update/replace: transform out, merge and emit if needed
        if (recordBefore && recordBefore.ok && recordBefore.value) {
            const recordBeforeTransformed = this.transformOut(odm, recordBefore.value);
            const finalResult = replace ? dataToUpdate : this.smartMerge(recordBeforeTransformed, dataToUpdate);
            // if (odm.broadcastChanges) {
            //     const changesData = ChangesEvent.findChanges(recordBeforeTransformed, finalResult);
            //     MethodEvent.emit('changes::' + odm.collectionName,
            //         new DataChangeEvent(odm.collectionName, changesData, finalResult), ServerType.RabbitMQ, this.getExchanges(odm));
            // }
            return finalResult;
        }

    }


    public static async updateMany<T>(filter: any, updateData: T, _upsert: boolean = false) {
        let odm: any = getOdm<T>(updateData) || this['odm'] as ODM;
        let updateDataTransformed = this.transformIn(odm, updateData);

        let updatedFilter = this.transformIn(odm, filter);

        let connection = await DBHandler.getConnection(odm.connectionName);
        // if (odm.broadcastChanges) {
        //     await this.publishEvent<T>(query, updateData, odm, null, securityContext);
        // }
        let result: any = null;
        result = await connection.collection(odm.collectionName)
            .updateMany(updatedFilter,
                { $set: updateDataTransformed },
                {
                    upsert: _upsert
                });

        return result;
    }



    public static async delete<T>(filter: any, model: T = null, justOne: boolean = true) {
        let odm: any = model ? getOdm<T>(model) : this['odm'] as ODM;
        let connection = await DBHandler.getConnection(odm.connectionName);
        let result;

        let updatedFilter = this.transformIn(odm, filter);

        if (justOne) {
            result = await connection.collection(odm.collectionName).deleteOne(updatedFilter);
        } else {
            result = await connection.collection(odm.collectionName).deleteMany(updatedFilter);
        }
        // if (odm.broadcastChanges) {
        //     MethodEvent.emit('delete::' + odm.collectionName,
        //         new DataChangeEvent(odm.collectionName, result, null), ServerType.RabbitMQ, this.getExchanges(odm));

        // }
        return result;
    }


    public static async query(query: Query, returnType?: ReturnType) {
        return await query.run(returnType);
    }

    
    // private static async publishEvent<T>(query, updateData, odm, dataId: string = null, securityContext?: Tmla.ISecurityContext) {
    //     try {
    //         let changesData = await ChangesEvent.findChanges<T>(query, updateData, dataId);
    //         let eventResult = await MethodEvent.emit('changes::' + odm.collectionName,
    //             new DataChangeEvent(odm.collectionName, changesData.dataChanged, updateData, securityContext), ServerType.RabbitMQ, this.getExchanges(odm));
    //     }
    //     catch (error) {
    //         logger.error(error);
    //     }
    // }

}
