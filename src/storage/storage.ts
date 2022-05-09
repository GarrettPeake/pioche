import { GetOptions, ListOptions, PutOptions } from "../types";

/**
 * Superclass for interacting with storage elements  
 * Enforces unified API for `get`, `put`, `remove`, `removeAll`, `keys`, `items`  
 * Implements chaining syntax allowing `storage.prop1.get()` etc...  
 * Adds native syntax for `storage.prop1 = 5` and `delete storage.prop1`
 */
export abstract class StorageElement<T extends DurableObjectStorage | KVNamespace>{

    protected element: T;
    private handler: any;
    private chain: any[] = [];
  
    constructor(element: T){
        this.element = element;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thisRef = this; // Needed to use this within handler
        this.handler = {
            get(_: any, key:any): any{
                thisRef.chain.push(key);
                return new Proxy(thisRef.finalizerFactory(), this);
            },
            set(_: any, key: any, value: any): any {
                thisRef.chain.push(key, "put");
                thisRef.finalizerFactory()(value);
                return true;
            },
            defineProperty(_: any, key: any, value: any): any {
                thisRef.chain.push(key, "put");
                thisRef.finalizerFactory()(value);
                return true;
            },
            deleteProperty(_: any, key: any): any {
                thisRef.chain.push(key, "remove");
                thisRef.finalizerFactory()();
                return true;
            }
        };
        return new Proxy(
            (this.finalizerFactory() as any as StorageElement<T>),
            this.handler as any
        );
    }
  
    /**
     * Returns a function that can be called to enact the end of the chain  
     * `storage.prop1` is a function, `storage.prop1.get` is also a function with
     * a valid end-of-chain, when called `storage.prop1.get()` will retrive prop1
     * from the base element and return its value.
     * @returns A "finalizer" function
     */
    private finalizerFactory(){
        return (...args: any[]) => {
            if(!this.chain.length)
                throw new Error("Cannot call class StorageElement");
            const currChain = [...this.chain];
            this.chain = [];
            const func = currChain.pop();
            if(typeof (this as any)[func] === "function"){
                if(currChain.length){ // We'll want to call the chain version
                    return (this as any)["chain" + func](currChain, ...args);
                } else { // Just call the regular version
                    return (this as any)[func](...args);
                }
            } else {
                throw new Error(`Method ${func} does not exist on StorageElement`);
            }
        };
    }
  
    //===============================================================
    //============== GET FUNCTIONALITIES ============================
    /**
     * Retrieve an object from storage.  
     * NOTE: key/s is optional in chaining signature
     * NOTE: Chaining will not allow assignment of chars within a string
     * NOTE: The chain apart from the final key must already exist
     * ```ts
     * storage.get("prop1", getOptions?); // Normal get
     * storage.get(["prop1", "prop2"], getOptions?); // Multi get
     * storage.prop1.prop2.get(key?, getOptions?); // Deep get
     * ``` 
     * @param key The intended key or keys to retrieve (optional when chaining)
     * @param getOptions Get options
     * @returns A promise for the value or list of promises for values retrieved
     * @uses 
     * * KV:
     *   * Base: 1 x read / key
     *   * Chain: 1 x read
     * * DO: read/write units are charged per 4kb read/written
     *   * Base: 1 x read / key
     *   * Chain: 1 x read
     */
    abstract get(key: any|any[], getOptions?: GetOptions<T>): Promise<any>;
  
    /** Chain implementation of get method */
    private async chainget(chain: any[], key?: any|any[], getOptions?: GetOptions<T>): Promise<any> {
        // Retrieve base
        let base = await this.get(chain[0], getOptions);
        // Descend the chain
        chain.slice(1, chain.length).forEach((k) => {
            base = base?.[k];
        });
        // If we have keys, retrieve them from the end
        if(key){
            if(Array.isArray(key))
                return key.map((k) => base?.[k]);
            return base?.[key];
        }
        // Otherwise just return the base
        return base;
    }
  
    //===============================================================
    //============== PUT FUNCTIONALITIES ============================
    /**
     * Put a (key, value) pair into storage or use chaining to put at depth  
     * NOTE: chaining signature is `.put(value, getOptions?, putOptions?)`  
     * NOTE: Setting key to undefined will generate a UUID
     * ```ts
     * storage.put("prop1", "val", putOptions?); // Basic put operation
     * storage.put(undefined, "val", putOptions?); // Generates a UUID
     * storage.prop1.prop2.put("val", getOptions?, putOptions?); // Deep put
     * storage.prop1 = "val"; // Basic put using native syntax
     * storage.prop1.prop2 = "val"; // Deep put using native syntax
     * ```
     * @param key The key to write to or undefined for UUID (non-chaining)
     * @param value The value to associate with the key
     * @param getOptions Get options (chaining)
     * @param putOptions Put options
     * @returns A promise for the key the value was written to or false if chain failed
     * @uses 
     * * KV:
     *   * Base: 1 x write
     *   * Chain: 1 x read + 1 x write
     * * DO: read/write units are charged per 4kb read/written
     *   * Base: 1 x write
     *   * Chain: 1 x read + 1 x write
     */
    abstract put(key: string, value: any, putOptions?: PutOptions<T>): Promise<string>;
  
    /** Chain implementation of put method */
    private async chainput(chain: any[], value: any, getOptions?: GetOptions<T>, putOptions?: PutOptions<T>): Promise<string>{
        if(chain.length === 1)
            return this.put(chain[0], value, putOptions);
        // Retrieve the base
        let base = await this.get(chain[0], getOptions);
        const origin = base;
        // Descend the chain keeping track of an ancestor
        chain.slice(1, chain.length - 1).forEach((k) => {
            base = base?.[k];
        });
        // Set the new value
        const lastKey = chain[chain.length - 1];
        base[lastKey] = value;
        // Write the new value back to storage
        return this.put(chain[0], origin, putOptions);
    }

    //===============================================================
    //============== SPREAD FUNCTIONALITIES ============================
    /**
     * Acts like JS spread operator: all (key, value) pairs in value
     * are added to the object at the end of the chain  
     * Attempting to spread on a value other than an array or object will
     * throw and error
     * NOTE: must be used with chaining  
     * ```ts
     * storage.prop1.prop2.spread({
     *      prop3: "value",
     *      prop4: "value2"
     *   }, getOptions?, putOptions?
     * ); // Puts prop3 and prop4 in storage.prop1.prop2
     * ```
     * @param value The object to use (key, value) pairs from
     * @param getOptions Get options
     * @param putOptions Put options
     * @returns A promise for the post-spread object
     * @uses 
     * * KV:
     *   * Base: Not allowed
     *   * Chain: 1 x read + 1 x write
     * * DO: read/write units are charged per 4kb read/written
     *   * Base: Not allowed
     *   * Chain: 1 x read + 1 x write
     * @uses 1 x read, 1 x write
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async spread(value: any, getOptions?: GetOptions<T>, putOptions?: PutOptions<T>): Promise<any> {
        throw new Error("Cannot call spread on storage object, must provide chain");
        return {};
    }
    
    /** Chain implementation of spread method */
    private async chainspread(chain: any[], value: any, getOptions?: GetOptions<T>, putOptions?: PutOptions<T>): Promise<any>{
        // Retrieve the base
        let base = await this.get(chain[0], getOptions);
        const origin = base;
        // Descend the chain keeping track of an ancestor
        chain.slice(1, chain.length - 1).forEach((k) => {
            base = base?.[k];
        });
        // Set the new value
        const lastKey = chain[chain.length - 1];
        if(Array.isArray(base[lastKey]))
            base[lastKey] = [...base[lastKey], ...value];
        else if(typeof base[lastKey] === "object")
            base[lastKey] = {...base[lastKey], ...value};
        else
            throw new Error("Attempting to spread on value other than object or array");
        // Write the new value back to storage
        this.put(chain[0], origin, putOptions);
        // Return the spread object
        return origin;
    }
  
    //===============================================================
    //============== REMOVE FUNCTIONALITIES ============================
    /**
     * Removes the key/s from the storage or object in storage
     * NOTE: key/s is optional in chaining signature
     * ```ts
     * storage.remove(key, putOptions?);
     * storage.c1.c2.delete(key?, getOptions?, putOptions?);
     * delete storage.c1.c2;
     * ```
     * @param key The key or list of keys to remove (optional when chaining)
     * @param getOptions Get options (chaining)
     * @param putOptions Put options
     * @returns A promise for a boolean whether removal was successful
     * @uses 
     * * KV:
     *   * Base: 1 x delete / key
     *   * Chain: 1 x read + 1 x write
     * * DO: read/write units are charged per 4kb read/written
     *   * Base: 1 x delete / key
     *   * Chain: 1 x read + 1 x write
     */
    abstract remove(key: any|any[], putOptions?: PutOptions<T>): Promise<boolean>;
  
    /** Chain implementation of remove method */
    private async chainremove(chain: string[], key?: any|any[], getOptions?: GetOptions<T>, putOptions?: PutOptions<T>): Promise<boolean> {
        if(chain.length === 1 && key === undefined)
            return this.remove(key, putOptions);
        // Retrieve the base
        let base = await this.get(chain[0], getOptions);
        const origin = base;
        // Descend the chain
        chain.slice(1, chain.length - 1).forEach((k) => {
            base = base?.[k];
        });
        // Remove the value/s
        const lastKey = chain[chain.length - 1];
        if(key !== undefined){
            if(chain.length > 1) // Don't reuse the first key
                base = base?.[lastKey];
            ([].concat(key)).forEach((k: string) => {
                delete base[k];
            });
        } else {
            delete base[lastKey];
        }
        // Write the new value back to storage
        this.put(chain[0], origin, putOptions);
        return true;
    }
  
    //===============================================================
    //============== REMOVEALL FUNCTIONALITIES ============================
    /**
     * Removes all (key, value) pairs from the storage or object in storage
     * ```ts
     * storage.removeAll(putOptions?);
     * storage.c1.c2.removeAll(getOptions?, putOptions?);
     * ```
     * @param getOptions Get options (chaining)
     * @param putOptions Put options
     * @returns A promise for true
     * @uses 
     * * KV:
     *   * Base: 1 x list + 1 x delete / key
     *   * Chain: 1 x read + 1 x write
     * * DO: read/write units are charged per 4kb read/written
     *   * Base: 1 x delete / key
     *   * Chain: 1 x read + 1 x write
     */
    abstract removeAll(putOptions: PutOptions<T>): Promise<void>;
  
    /** Chain implementation of removeAll method */
    private async chainremoveAll(chain: string[], getOptions?: GetOptions<T>, putOptions?: PutOptions<T>): Promise<void> {
        // Retrieve the base
        let base = await this.get(chain[0], getOptions);
        const origin = base;
        // Descend the chain
        chain.slice(1, chain.length).forEach((k) => {
            base = base?.[k];
        });
        // Remove the value/s
        if(Array.isArray(base))
            base.length = 0;
        else if (typeof base === "object"){
            for (const member in base)
                delete base[member];
        } else {
            throw new Error("Attempting to use removeAll on non object");
        }
        // Write the new value back to storage
        this.put(chain[0], origin, putOptions);
    }
  
    //===============================================================
    //============== KEYS FUNCTIONALITIES ============================
    /**
     * Retrieves a list of keys from storage or from the chained object in
     * storage
     * ```ts
     * storage.keys(listOptions?); // Basic keys
     * storage.prop1.prop2.keys(getOptions?); // Deep keys
     * ```
     * @param listOptions List options (non-chaining)
     * @param getOptions Get options (chaining)
     * @returns A promise for a key iterator object from storage or object
     * @uses
     * * KV:
     *   * Base: 1 x list
     *   * Chain: 1 x read
     * * DO: Actually reads keys **and** values, read/write units are charged per 4kb read/written
     *   * Base: 1 x list (charged as 1 x read / 4kB)
     *   * Chaining: 1 x read (just for the one key accessed)
     */
    abstract keys(listOptions?: ListOptions<T>): Promise<{keys: string[], cursor: string, complete: boolean}>;
  
    // `storage.c1.c2.keys(options?)`
    /** Chain implementation of keys method */
    private async chainkeys(chain: string[], getOptions?: GetOptions<T>): Promise<{keys: string[], cursor: string, complete: boolean}> {
        // Retrieve the base
        let base = await this.get(chain[0], getOptions);
        // Descend the chain
        chain.slice(1, chain.length).forEach((k) => {
            base = base?.[k];
        });
        // Retrieve the keys
        if(typeof base === "object"){
            const keys = Object.keys(base);
            return {keys: keys, cursor: keys[keys.length-1], complete: true};
        } else
            throw new Error("Attempting to use keys on non object");
    }
  
    //===============================================================
    //============== ITEMS FUNCTIONALITIES ============================
    /**
     * Retrieves a list of (key, value) pairs from storage or from the chained
     * object in storage
     * ```ts
     * storage.items(listOptions?); // Basic items
     * storage.prop1.prop2.items(getOptions?); // Deep items
     * ```
     * @param listOptions List options (non-chaining)
     * @param getOptions Get options (chaining)
     * @returns A promise for an item iterator object from storage or object
     * @uses
     * * KV:
     *   * Base: 1 x list + 1 x read / key
     *   * Chain: 1 x read
     * * DO: read/write units are charged per 4kb read/written
     *   * Base: 1 x list (charged as 1 x read / 4kB)
     *   * Chaining: 1 x read (just for the one key accessed)
     */
    abstract items(listOptions?: ListOptions<T>): Promise<{items: any, cursor: string, complete: boolean}>;
    
    /** Chain implementation of items method */
    private async chainitems(chain: string[], getOptions?: GetOptions<T>): Promise<{items: any, cursor: string, complete: boolean}> {
        // Retrieve the base
        let base = await this.get(chain[0], getOptions);
        // Descend the chain
        chain.slice(1, chain.length).forEach((k) => {
            base = base?.[k];
        });
        // Retrieve the items
        if(typeof base === "object"){
            const entries = Object.entries(base);
            return {items: entries, cursor: entries[entries.length-1][0], complete: true};
        } else
            throw new Error("Attempting to use items on non object");
    }
}
