import { GetOptions, ListOptions, PutOptions } from "../types";

/**
 * Superclass for interacting with storage elements
 */
export abstract class StorageElement<T extends DurableObjectStorage | KVNamespace>{

    protected element: T;
    private handler: any;
    private chain: any[] = [];
  
    constructor(element: T){
        this.element = element;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thisRef = this;
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
  
    private finalizerFactory(){
        return (...args: any[]) => {
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
                throw Error(`Method ${func} does not exist on StorageElement`)
            }
        };
    }
  
    //============== GET FUNCTIONALITIES ============================
    // `storage.get(key, options?)`
    abstract get(key: string | string[], options: {getOptions: GetOptions<T>}): any;
  
    // `storage.c1.c2.get(options?)`
    private chainget(chain: any[], options: {getOptions?: GetOptions<T>} = {}) {
        return false;
    }
  
    //============== PUT FUNCTIONALITIES ============================
    // If null key, generate a UUID and return it
    abstract put(key: string | null, value: any, options: {putOptions: PutOptions<T>}): boolean;
  
    // `storage.c1.c2.put(value: any, options?)` --or-- `storage.c1.c2 = value: any;`
    private chainput(chain: any[], value: any, options: {getOptions?: GetOptions<T>, putOptions?: PutOptions<T>} = {}): boolean{
        return false;
    }
  
    // Just for intellisense
    spread(value: any, options: {getOptions?: GetOptions<T>, putOptions?: PutOptions<T>} = {}) {
        throw Error("Cannot call spread on storage object, must provide chain");
    }
    // `storage.c1.c2.spread(object, options?)`
    // if the chain is a single key and doesn't exist, make it
    // if the spreading object is an array, make it an array, and same for object
    private chainspread(chain: any[], value: any, options: {getOptions?: GetOptions<T>, putOptions?: PutOptions<T>} = {}): boolean{
        return false;
    }
  
    //============== REMOVE FUNCTIONALITIES ============================
    // `storage.remove(key, options?)`
    abstract remove(key: string | string[], options: {putOptions?: PutOptions<T>}): boolean;
  
    // `storage.c1.c2.delete(key?, options?)` --or-- `remove storage.c1.c2`
    private chainremove(chain: string[], options: {getOptions?: GetOptions<T>, putOptions?: PutOptions<T>} = {}): boolean {
        return false;
    }
  
    // `storage.removeAll(options?)`
    abstract removeAll(options: {putOptions: PutOptions<T>}): boolean;
  
    // `storage.c1.c2.removeAll(options?)`
    private chainremoveAll(chain: string[], options: {getOptions?: GetOptions<T>, putOptions?: PutOptions<T>} = {}): boolean {
        return false;
    }
  
    //============== KEYS FUNCTIONALITIES ============================
    // `storage.keys(options?)` If options is not provided, call the separate `list()` method, not `list(null)`
    abstract keys(options: {listOptions?: ListOptions<T>}): {keys: string[], cursor: string, complete: boolean}
  
    // `storage.c1.c2.keys(options?)`
    private chainkeys(chain: string[], options: {listOptions?: ListOptions<T>}={}): {keys: string[], cursor: string, complete: boolean} {
        return {keys :[], cursor: "", complete: false};
    }
  
    //============== ITEMS FUNCTIONALITIES ============================
    // `storage.items(options?)`
    abstract items(options: {listOptions?: ListOptions<T>}): {keys: string[], cursor: string, complete: boolean}
    // `storage.c1.c2.items(options?)`
    private chainitems(chain: string[], options: {listOptions?: ListOptions<T>}={}): {keys: string[], cursor: string, complete: boolean}{
        return {keys :[], cursor: "", complete: false};
    }
}
