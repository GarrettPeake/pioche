

/**
 * Superclass for interacting with storage elements
 */
abstract class StorageElement{
    
    element: any = undefined;

    constructor(element: string | KVNamespace | DurableObjectStorage){
        this.element = element;
    }

    //============== GET FUNCTIONALITIES ============================
    // storage.get(key, options?)
    abstract get(
        key: string | string[],
        options: {
            getOptions: KVNamespaceGetOptions<any> | DurableObjectGetOptions
        }): {value: any, metadata: object}

    // storage.c1.c2.get(options?)
    abstract chainGet(
        chain: any[],
        options: {
            getOptions: KVNamespaceGetOptions<any> | DurableObjectGetOptions
        }): {value: any, metadata: object}


    //============== PUT FUNCTIONALITIES ============================
    // If null generate a UUID and return it
    abstract put(
        key: string | null,
        value: any,
        options: {
            putOptions: KVNamespacePutOptions | DurableObjectPutOptions
        }): boolean

    // storage.c1.c2.put(object, options?)
    // storage.c1.c2 = value: any;
    abstract chainPut(
        chain: string[],
        value: any,
        options: {
            getOptions: KVNamespaceGetOptions<any> | DurableObjectGetOptions,
            putOptions: KVNamespacePutOptions | DurableObjectPutOptions
        }): boolean; // Performs set, not spread

    // storage.c1.c2.spread(object, options?)
    abstract chainSpread(
        chain: string[],
        value: object,
        options: {
            getOptions: KVNamespaceGetOptions<any> | DurableObjectGetOptions,
            putOptions: KVNamespacePutOptions | DurableObjectPutOptions
        }): any; // Performs a {...newvals} and returns result


    //============== DELETE FUNCTIONALITIES ============================
    // storage.delete(key, options?)
    abstract delete(
        key: string | string[],
        options: {
            putOptions: KVNamespacePutOptions | DurableObjectPutOptions
        }): boolean

    // storage.c1.c2.delete(key?, options?)
    // delete storage.c1.c2
    abstract chainDelete(
        chain: string[],
        options: {
            getOptions: KVNamespaceGetOptions<any> | DurableObjectGetOptions,
            putOptions: KVNamespacePutOptions | DurableObjectPutOptions
        }): boolean

    // storage.deleteAll(options?)
    abstract deleteAllKeys(
        options: {
            putOptions: KVNamespacePutOptions | DurableObjectPutOptions
        }): boolean

    // storage.c1.c2.deleteAll(options?)
    abstract chainDeleteAllKeys(
        chain: string[],
        options: {
            getOptions: KVNamespaceGetOptions<any> | DurableObjectGetOptions,
            putOptions: KVNamespacePutOptions | DurableObjectPutOptions
        }): boolean


    //============== KEYS FUNCTIONALITIES ============================
    // storage.keys(options?) If options is not provided, call the separate list() method, not list(null)
    abstract keys(
        options: {
            listOptions: KVNamespaceListOptions | DurableObjectListOptions
        }): {keys: string[], cursor: string, complete: boolean}
    // storage.c1.c2.keys(options?)
    abstract chainKeys(
        chain: string[],
        options: {
            listOptions: KVNamespaceListOptions | DurableObjectListOptions
        }): {keys: string[], cursor: string, complete: boolean}


    //============== ITEMS FUNCTIONALITIES ============================
    // storage.items(options?)
    abstract items(
        options: {
            listOptions: KVNamespaceListOptions | DurableObjectListOptions
        }): {keys: string[], cursor: string, complete: boolean}
    // storage.c1.c2.items(options?)
    abstract chainItems(
        chain: string[],
        options: {
            listOptions: KVNamespaceListOptions | DurableObjectListOptions
        }): {keys: string[], cursor: string, complete: boolean}
}

function createStorageProxy(element: any){
    var handler = {
        chain: [],
        resolve(target: any, func: string){
            let currChain = [...this.chain]
            let result = (...args: any) => target[func](currChain, ...args);
            this.chain = []
            return result
        },
        get(target:any, key:any): any{
            if(typeof target[key] === 'function'){
                return this.resolve(target, key);
            }
            this.chain.push(key);
            return new Proxy(target, this);
        },
        set (target: any, key: any, value: any): any {
            this.chain.push(key)
            return this.resolve(target, "assign")(value);
        },
        defineProperty (target: any, key: any, value: any): any {
            this.chain.push(key)
            return this.resolve(target, "assign")(value);
        },
        deleteProperty (target: any, key: any): any {
            this.chain.push(key)
           return this.resolve(target, "remove")();
        }
    }
    return new Proxy(element, handler);
}