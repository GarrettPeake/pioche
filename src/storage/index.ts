import { Session } from "../io/input"
import { DOTarget } from "../types"

/** Add a KV namespace binding to the target controller */
export function KVBinding(namespace: string){
    return (target: any) => {
        console.log(`KV Binding not implemented: attempting to bind ${namespace}`)
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