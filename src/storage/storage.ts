

/**
 * Superclass for interacting with storage elements
 */
abstract class StorageElement{

    abstract ELEMENT: any;
    abstract namespaces: string[]; // List of KV namespaces to be initialized  TODO: this is not extensible to mongo or sql or whatever

    /**
     * Retrieves the stored element
     * @param getOptions Additional options passed to the storage get command
     * Cost: 1x read
     */
    abstract retrieve(chain: any[], getOptions: any): Promise<any>;

    /**
     * Assigns the end-of-chain location to the given value
     * The type of the value is retained for subsequenty accesses
     * TODO: use metadata in KV
     * @param value The value to place in storage
     * @param getOptions Additional ptions passed to the storage get command
     * @param putOptions Additional ptions passed to the storage put command
     * Cost: 
     *  Top-level: 1x write
     *  Sub-item: 1x read + 1x write
     */
    abstract assign(chain: any[], value: any, getOptions: any, putOptions: any): Promise<boolean>;

    /**
     * Deletes a whole object or single key of an object in memory
     * @param options Deletion options
     * Cost: 
     *  Top-level: 1x delete
     *  Sub-item: 1x read + 1x write
     */
     abstract remove(chain: any[], putOptions: any, getOptions: any): Promise<boolean | void>;

    /**
     * Gets all keys at a certain chain in storage
     * @param args Additional options passed to the storage list command
     * Cost: Top-Level = 1x List, Sub-item = 1x read
     */
    abstract keys(chain: any[], listOptions: any, getOptions: any): Promise<string[]>;

    /**
     * Allows the user to get all keys and values at a chain as an object
     * @param args Additional options passed to the storage list command
     * Cost:
     *  Top-Level:
     *      DO: 1x list
     *      KV: 1x list + Nx reads
     *  Sub-item:
     *      DO: 1x read
     *      KV: 1x read
     */
    abstract entries(chain: any[], listOptions: any, getOptions: any): Promise<any[][]>;
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