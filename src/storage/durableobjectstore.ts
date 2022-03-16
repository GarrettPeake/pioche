/**
 * Superclass for interacting with storage elements
 */
class DurableObjectStore extends StorageElement{

    ELEMENT: DurableObjectStorage;

    /**
     * Constructs the superclass for storage element interaction
     * @param element A durable object storage object
     */
    constructor(element: DurableObjectStorage){
        super();
        this.ELEMENT = element;
    }

    /**
     * Retrieves the stored element
     * @param getOptions Additional options passed to the storage get command
     * Cost: 1x read
     */
    async retrieve(chain: any[], getOptions: DurableObjectGetOptions): Promise<unknown>{
        if(chain.length === 0)
            return undefined
        return this.ELEMENT.get(chain[0], getOptions).then((data) => {
            chain.shift();
            for(const chainer of chain){
                data = data?.[chainer]
            }
            return data;
        })
    }

    /**
     * Assigns the end-of-chain location to the given value
     * The type of the value is retained for subsequenty accesses
     * TODO: use metadata in KV
     * @param value The value to place in storage
     * @param getOptions Additional options passed to the storage get command
     * @param putOptions Additional options passed to the storage put command
     * Cost: 
     *  Top-level: 1x write
     *  Sub-item: 1x read + 1x write
     */
    async assign(chain: any[], value: any, putOptions: DurableObjectPutOptions, getOptions: DurableObjectGetOptions): Promise<boolean>{
        if(chain.length === 0)
            return false
        if(chain.length === 1)
            return this.ELEMENT.put(chain[0], value, putOptions).then(() => true);

        let key = chain[0]
        return this.ELEMENT.get(key, getOptions).then((data) => {
            chain.shift();
            let tbs = chain.pop(); // Take note of the element we want to set
            let diver = data;
            for(const chainer of chain){
                diver = diver?.[chainer]
            }
            diver[tbs] = value; // Set the intended key to the value
            return data;
        }).then(writeData => this.ELEMENT.put(key, writeData, putOptions)).then(()=> true);
    }

    /**
     * Deletes a whole object or single key of an object in memory
     * @param options Deletion options
     * Cost: 
     *  Top-level: 1x delete
     *  Sub-item: 1x read + 1x write
     */
    async remove(chain: any[], putOptions: DurableObjectPutOptions, getOptions: DurableObjectGetOptions): Promise<boolean | void>{
        if(chain.length === 0)
            return undefined
        if(chain.length === 1)
            return this.ELEMENT.delete(chain[0], putOptions);
        
        let key = chain[0]
        return this.ELEMENT.get(key, getOptions).then((data) => {
            chain.shift();
            let tbr = chain.pop(); // Take note of the element we want to remove
            let diver = data;
            for(const chainer of chain){
                diver = diver?.[chainer]
            }
            delete diver[tbr]; // Remove the intended element
            return data;
        }).then(writeData => {
            return this.ELEMENT.put(key, writeData, putOptions)
        });
    }

    /**
     * Gets all keys at a certain chain in storage
     * @param args Additional options passed to the storage list command
     * Cost: Top-Level = 1x List, Sub-item = 1x read
     */
    async keys(chain: any[], listOptions: DurableObjectListOptions, getOptions: DurableObjectGetOptions): Promise<string[]>{
        if(chain.length === 0)
            return undefined

        if(chain.length === 1){
            if(listOptions)
                return this.ELEMENT.list(listOptions).then(data => {
                    return Array.from(data.keys())
                })
            else
                return this.ELEMENT.list().then(data => {
                    return Array.from(data.keys())
                })
        }

        return this.retrieve(chain, getOptions).then(data => {
            if(typeof data === 'object')
                return Object.keys(data)
            else
                return undefined
        })
    }

    /**
     * Allows the user to get all keys and values at a chain as an object
     * @param args Additional options passed to the storage list command
     * Cost:
     *  Top-Level:
     *      DO: 1x list
     *      KV: 1x list + N reads
     *  Sub-item:
     *      DO: 1x read
     *      KV: 1x read
     */
    async entries(chain: any[], listOptions: DurableObjectListOptions, getOptions: DurableObjectGetOptions): Promise<any[][]>{
        if(chain.length === 0)
        return undefined

        if(chain.length === 1){
            if(listOptions)
                return this.ELEMENT.list(listOptions).then(data => {
                    return Array.from(data.entries())
                })
            else
                return this.ELEMENT.list().then(data => {
                    return Array.from(data.entries())
                })
        }

        return this.retrieve(chain, getOptions).then(data => {
            if(typeof data === 'object')
                return Object.entries(data)
            else
                return undefined
        })
    }
}