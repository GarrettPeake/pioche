
/**
 * Abstract superclass for the different types of resources
 * Only provides function wrappers and logging functionality
 */
export abstract class WorkerController{

    liveLogging: boolean = false; // Whether to post each log as they come in
    env: any = {}; // Set by fetch functions on each host

    constructor(env: any){
        // Make the environment available to the entire framework
        globalThis.env = env;
        this.env = env;
    }

    addKVBindings(){
        (this.constructor as any).KVBinds.entries.forEach(([key, value]) => {
            this[key] = new KVStore(value);
        })
    }
}
