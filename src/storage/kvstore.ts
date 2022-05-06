// We might define some way to access metadata like keys will be a dict with key: metadata

import { randomUUID } from "crypto";
import { StorageElement } from "./storage";

/**
 * Storage interface for KV storage namespaces
 */
export class KVStore extends StorageElement<KVNamespace>{

    /** Maintain type with KV storage so we do `.put(key, JSON.stringify({original: value}))` */
    private async getActual(key: string, getOptions?: KVNamespaceGetOptions<any>): Promise<any>{
        let final = await this.element.get(key, getOptions);
        try{
            final =  final ? JSON.parse(final)["original"] : final;
        } catch {}
        return final;
    }
    
    async get(key: any, getOptions?: KVNamespaceGetOptions<any>): Promise<any> {
        if(Array.isArray(key)){
            const rarr: any[] = [];
            for(const k of key){
                rarr.push(this.getActual(k.toString(), getOptions));
            }
            return Promise.all(rarr);
        }
        return await this.getActual(key.toString(), getOptions);
    }
    
    async put(key: string, value: any, putOptions?: KVNamespacePutOptions): Promise<string> {
        if(!key)
            key = randomUUID();
        await this.element.put(key, JSON.stringify({original: value}), putOptions);
        return key;
    }
    
    async remove(key: any, putOptions?: KVNamespacePutOptions): Promise<boolean> {
        await this.element.delete(key.toString());
        return true;
    }
    
    async removeAll(putOptions: KVNamespacePutOptions): Promise<void> {
        let complete = false;
        let cursor = undefined;
        while(!complete){
            const value = cursor ? await this.element.list({cursor}) : await this.element.list();
            value.keys.forEach(({name}) => {
                this.element.delete(name);
            });
            complete = value.list_complete;
            cursor = value.cursor;
        }
    }
    
    async keys(listOptions?: KVNamespaceListOptions): Promise<{ keys: string[]; cursor: string; complete: boolean; }> {
        const value = await this.element.list(listOptions);
        return {
            keys: value.keys.map(({name})=>name), // TODO: This scrubs metadata and expiration
            complete: value.list_complete,
            cursor: value.cursor
        };
    }
    
    async items(listOptions?: KVNamespaceListOptions): Promise<{ items: any; cursor: string; complete: boolean; }> {
        const value = await this.element.list(listOptions);
        const items = [];
        for(const key of value.keys){
            items.push([key.name, await this.get(key.name)]);
        }
        return {
            items: items, // TODO: This scrubs metadata and expiration
            complete: value.list_complete,
            cursor: value.cursor
        };
    }
}