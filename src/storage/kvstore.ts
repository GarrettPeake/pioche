// We might define some way to access metadata like keys will be a dict with key: metadata

import { StorageElement } from "./storage";

/**
 * Storage interface for KV storage namespaces
 */
export class KVStore extends StorageElement<KVNamespace>{
    get(key: string | string[], getOptions?: KVNamespaceGetOptions<any>) {
        throw new Error("Method not implemented.");
    }
    put(key: string, value: any, putOptions?: KVNamespacePutOptions): boolean {
        throw new Error("Method not implemented.");
    }
    remove(key: string | string[], putOptions?: KVNamespacePutOptions): boolean {
        throw new Error("Method not implemented.");
    }
    removeAll(options: { putOptions: KVNamespacePutOptions; }): boolean {
        throw new Error("Method not implemented.");
    }
    keys(listOptions?: KVNamespaceListOptions): { keys: string[]; cursor: string; complete: boolean; } {
        throw new Error("Method not implemented.");
    }
    items(listOptions?: KVNamespaceListOptions): { keys: string[]; cursor: string; complete: boolean; } {
        throw new Error("Method not implemented.");
    }
}