import { Session } from "../io/input"
import { DOTarget } from "../types"

/** Add a KV namespace binding to the target controller */
export function KVBindings(mappings: object){
    return (target: any) => {
        if(target.KVBinds){
            target.KVBinds = {...mappings, ...target.KVBinds}
        } else {
            target.KVBinds = mappings
        }
    }
}

/** Add a function telling the controller which D/O to route to */
export function DOTarget(
    targeter: DOTarget | // Allow a simple @DOTarget({name: 'example'})
    ((targetNS: DurableObjectNamespace, session: Session, ...des) => DOTarget)){
    return (target: any) => {
        // Add the targeter as a static property of the class
        target.DOTarget = (targetNS: DurableObjectNamespace, session: Session) => {
            return (typeof targeter === 'function') ? targeter(targetNS, session, session) : targeter;
        }
    }
}