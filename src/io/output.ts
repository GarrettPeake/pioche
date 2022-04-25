import { ResponseObject } from "../types";


export class OutboundResponse implements ResponseObject{

    status: number;
    statusText: string;
    headers: Headers;
    body: any;
    webSocket: WebSocket;
    response: Response;

    constructor({resp}: {resp?: Response} = {}){
        this.fromResponse(resp); // Used let endware edit DO response
    }

    /**
     * Set the parameters of the response based on a ResponseObject
     * WARNING: This will overwrite any previously edited data
     */
    fromObj({status, statusText, body, headers, webSocket}: ResponseObject): void{
        this.status = status && status >= 100 && status < 600 ? status : this.status;
        this.statusText = statusText ? statusText : this.statusText;
        this.body = body ? body : this.body;
        this.headers = headers ? headers : this.headers;
        this.webSocket = webSocket ? webSocket : this.webSocket;
    }

    /**
     * Set the response with a response object, overpowers all other setters
     * @param response The response object to return
     */
    fromResponse(response: Response): void{
        this.response = response; // TODO: Parse response to make it further editable
    }

    /**
     * Attempt to convert `data` to a response  
     * Objects using **only** reserved keys will be transformed into the corresponding response  
     * * `status`  
     * * `statusText`  
     * * `body`  
     * * `headers`  
     * * `webSocket`  
     * 
     * Response objects will not be transformed  
     * Any type of other data will be placed in the body with a 200 code
     */
    toResponse(): Response{
        // Check for response object
        if(this.response)
            return this.response;

        // Construct a response based on the rest of our data
        return new Response(this.body ? 
            (typeof this.body === "object" ? JSON.stringify(this.body) : this.body.toString())
            : "", this);
    }
}
