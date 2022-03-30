

/**
 * Attempt to convert anything to a response
 * Objects with reserved keys: code, body, headers, websocket will be transformed into the corresponding response
 * Responses will not be transformed
 * Any type of other data will be placed in the body with a 200 code
 * @param data Any type of data, will then try to convert to a response
 */
function responseFactory(data: any){
    console.log('Response factory is under construction!')
}

/**
 * Function decorator for functions where responses aren't 200
 * @param code The intended return code
 */
function HttpCode(code: number){
    return (target, prop, receiver) => {
        console.log('Adding status codes like this not supported yet')
    }
}

/**
 * Adds a header on each response
 * @param header The header to be added
 */
function Header(header: string, value: string){
    return (target, prop, receiver) => {
        console.log('Adding headers like this not supported yet')
    }
}