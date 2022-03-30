import { ClientSession } from "../types"

/** Add a KV namespace binding to the target controller */
export function KVBinding(namespace: string){
    return (target: any) => {
        console.log(`KV Binding not implemented: attempting to bind ${namespace}`)
    }
}

/** Add a function telling the controller which D/O to route to */
export function DOTarget(
    targeter: {name?: string, hex?: string} |
    ((session: ClientSession) => {id?: DurableObjectId, name?: string, hex?: string})){
    return (target: any) => {
        console.log(`DOTarget not implemented`)
    }
}