

export function KVBinding(namespace: string){
    return function(target: any){
        console.log(`KV Binding not implemented: attempting to bind ${namespace}`)
    }
}