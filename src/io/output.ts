import { ResponseObject } from "../types";


export class OutboundResponse implements ResponseObject{

    private _status: number;
    headers: Headers;
    body: any;
    webSocket: WebSocket;

    constructor({json}: {json?: any} = {}){
        this.headers = new Headers();
        if(json){
            this._status = json.status;
            json.headers.forEach(([name, value]) => {
                this.headers.append(name, value);
            });
            this.body = json.body;
            // this.webSocket = json.webSocket; // TODO: HOW TO SERIALIZE WEBSOCKET
        }
    }

    get status(): number {return this._status;}
    set status(newCode: number){
        if(newCode >= 100 && newCode < 600)
            this._status = newCode;
        else
            throw Error("Response status must be a number between 100 and 599");
    }

    /**
     * Set the parameters of the response based on a ResponseObject  
     * **WARNING**: This will overwrite any previously edited data
     */
    fromObj({status, body, headers, webSocket}: ResponseObject): void{
        this.status = status;
        this.body = body ? body : this.body;
        this.headers = headers ? headers : this.headers;
        this.webSocket = webSocket ? webSocket : this.webSocket;
    }

    /**
     * Set the response with a response object, overpowers all other setters  
     * **NOTE**: This does not access the passed response object  
     * **WARNING**: This will overwrite any previously edited data
     * @param response The response object to return
     */
    async fromResponse(response: Response): Promise<void>{
        const touch = response.clone(); // Don't edit the response object
        // Get the body of the response
        const tbp = await touch.text();
        try{ // Attempt to parse the body from JSON
            this.body = JSON.parse(tbp);
        } catch {
            this.body = tbp;
        }
        // Get the status of the response
        this._status = touch.status;
        // Get the headers from the response
        this.headers = touch.headers;
        // Get any websocket from the response
        this.webSocket = undefined; // TODO: How can we reconstruct the websocket property?
    }

    /**
     * Attempt to convert `data` to a response  
     * Objects using **only** reserved keys will be transformed into the corresponding response  
     * * `status`  
     * * `body`  
     * * `headers`  
     * * `webSocket`  
     * 
     * Response objects will not be transformed  
     * Any type of other data will be placed in the body with a 200 code
     */
    toResponse(): Response{
        // Construct a response based on the rest of our data
        return new Response(this.body ? 
            (typeof this.body === "object" ? JSON.stringify(this.body) : this.body.toString())
            : "", this);
    }

    /**
     * Turn this instance into a JSON object for transfer between Worker and Durable Objects
     * @returns A JSON representation of this object
     */
    toJSON(): object{
        return {
            status: this._status,
            headers: [...this.headers.entries()],
            body: this.body,
            // webSocket: this.webSocket // TODO: How to serialize and deserialize 
        };
    }
}
