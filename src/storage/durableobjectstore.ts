import { StorageElement } from "./storage";

/**
 * Storage interface for Durable Object storage elements
 */
export class DurableObjectStore extends StorageElement<DurableObjectStorage>{

    async get(key: any, getOptions?: DurableObjectGetOptions) {
        if(Array.isArray(key)){
            const rarr: any[] = [];
            for(const k of key){
                rarr.push(this.element.get(k, getOptions));
            }
            return Promise.all(rarr);
        }
        return await this.element.get(key, getOptions);
    }

    async put(key: string, value: any, putOptions?: DurableObjectPutOptions) {
        if(!key)
            key = crypto.randomUUID();
        await this.element.put(key, value, putOptions);
        return key;
    }

    async remove(key: any, putOptions?: DurableObjectPutOptions): Promise<boolean> {
        return await this.element.delete(key, putOptions);
    }

    async removeAll(putOptions?: DurableObjectPutOptions): Promise<void> {
        return await this.element.deleteAll(putOptions);
    }

    async keys(listOptions?: DurableObjectListOptions): Promise<{keys: string[], cursor: string, complete: boolean}> {
        const keys = [];
        (await this.element.list(listOptions)).forEach((k: any) => {
            keys.push(k);
        });
        return {
            keys,
            complete: !(listOptions?.limit && keys.length < listOptions?.limit),
            cursor: keys[keys.length - 1]
        };
    }

    async items(listOptions?: DurableObjectListOptions): Promise<{ items: any; cursor: string; complete: boolean; }> {
        const items = [];
        (await this.element.list(listOptions)).forEach((k: any, v: any) => {
            items.push([v, k]);
        });
        return {
            items,
            complete: !(listOptions?.limit && items.length < listOptions?.limit),
            cursor: items?.[items.length - 1]?.[0] || ""
        };
    }
}