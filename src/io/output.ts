

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
 * @param data Any type of data, will then try to convert to a response
 */
export function dataToResponse(data: any): Response{
    // Check for response object
    if(data instanceof Response){
        return (data as Response);
    }

    // Check for object shaped response
    const {status, statusText, body, headers, webSocket, ...other} = data;
    if(status || statusText || body || headers || webSocket && !other){ // We have a object shaped response
        return new Response( // Options will be destructured correctly in the constructor
            typeof body === "object" ? JSON.stringify(body) : String(body),
            data
        );
    }

    // Format a correct response
    return new Response( typeof data === "object" ? JSON.stringify(data) : String(data));
}

/**
 * Function decorator for functions where responses aren't 200 OK
 * @param code The intended return code
 */
export function HttpCode(code: number){
    return (target, prop, receiver) => {
        console.log("TODO: Adding status codes like this not supported yet");
    };
}

/**
 * Adds a header on each response
 * @param header The header to be added
 */
export function Header(header: string, value: string){
    return (target, prop, receiver) => {
        console.log("TODO: Adding headers like this not supported yet");
    };
}