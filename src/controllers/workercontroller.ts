import { KVStore } from "../storage/kvstore";
import { createStorageProxy } from "../storage/storage";

/**
 * Abstract superclass for the different types of resources
 * Only provides function wrappers and logging functionality
 */
export abstract class WorkerController{

    liveLogging = false; // Whether to stream logs or send a post-run "transcript"
    env: any = {}; // Set by fetch functions on each host

    constructor(env: any){
        // Make the environment available to the entire framework
        globalThis.env = env;
        this.env = env;
    }

    addKVBindings(){
        (this.constructor as any).KVBinds?.entries.forEach(([key, value]) => {
            this[key] = createStorageProxy(new KVStore(value));
        });
    }
}
