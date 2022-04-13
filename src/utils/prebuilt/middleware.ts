import { Session } from "../../io/input";

export function easyPreflight(session: Session, next: any){
    if(session.request.method === "OPTIONS"){
        session.logger.log("EXECUTING PREFLIGHT RESPONSE");
        const headers = {
            Allow: "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "*",
        };
        return {headers};
    }
    return next;
}