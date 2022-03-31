import { Session } from "../../io/input";
import { Logger } from "../../logging/logger";

export function easyPreflight(session: Session, next: any){
    if(session.request.method === "OPTIONS"){
        session.logger.log("EXECUTING PREFLIGHT RESPONSE")
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