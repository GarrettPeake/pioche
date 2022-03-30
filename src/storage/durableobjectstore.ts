/**
 * Superclass for interacting with storage elements
 */
class DurableObjectStore extends StorageElement{

    /**
     * Constructs the superclass for storage element interaction
     * @param element A durable object storage object
     */
    constructor(element: DurableObjectStorage){
        super(element);
    }
}