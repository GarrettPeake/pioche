// We might define some way to access metadata like keys will be a dict with key: metadata

/**
 * Storage interface for KV storage namespaces
 */
 class KVStore extends StorageElement{

    /**
     * Constructs the superclass for storage element interaction
     * @param element A KVNamespace object
     */
    constructor(element: KVNamespace){
        super(element);
    }
}