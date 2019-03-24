import { EventEmitter } from 'events';
import { DataChangeEvent } from './changes';

export class DataEmitter extends EventEmitter {
    changes(topic, changeData: DataChangeEvent, securityContext?: any) {
        this.emit(topic, changeData, securityContext);
    }
}

export const EventDataEmitter = new DataEmitter();