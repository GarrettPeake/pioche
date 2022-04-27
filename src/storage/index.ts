export { KVStore } from "./kvstore";
export { DurableObjectStore } from "./durableobjectstore";

/** Add a KV namespace binding to the target controller */
export function KVBindings(mappings: object){
    return (target: any) => {
        if(target.KVBinds){
            target.KVBinds = {...mappings, ...target.KVBinds};
        } else {
            target.KVBinds = mappings;
        }
    };
}