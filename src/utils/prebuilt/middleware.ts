import { Logger } from "../../logging/logger";

export function easyPreflight(session: ClientSession, next: any){
    let logger = new Logger(session)
    if(session.method === "OPTIONS"){
        logger.log("EXECUTING PREFLIGHT RESPONSE")
        let headers = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE',
            'Allow': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': '*',
        }
        return {headers}
    }
    return next
}