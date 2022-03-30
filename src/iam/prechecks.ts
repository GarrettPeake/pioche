import { PermissionedObject } from "../types";
import { JResponse, WorkerRequest } from "../utils";

/** TODO: Convert to decorator
 * Authorize an action using permissioning
 * @param event A session object
 * @param authobj An object representing permissions required for the action
 * @returns A non-auth response or the result of the action
 */
export async function assertPerms(session: Session, authobj){
    if(!checkPerms(session, 'TODO'))
        throw Error("403");
}

/**
 * Scrape permissioned data from an object 
 * @param event The event object
 * @param permmedobj An object with a data an permissions mask
 * @returns A copy of the object with data requiring higher perms removed
 */
export async function maskPerms(event: WorkerRequest, permmedobj: PermissionedObject){
    let r_obj = {...permmedobj.data}; // Copy the object
    let perms = {...permmedobj.mask}; // Copy the permissions mask
}

/**
 * Check whether the user has the required permissions
 * @param event The formatted request event
 * @param perms A list of requirements
 *  Example: [["configsRead", "viewAny"], "level1"] is level1 || (configsRead && viewAny)
 * @returns boolean whether check passed
 */
export function checkPerms(event, requirements){
    requirements = ["ifficient", "owner", "internal"].concat(requirements);
    for(var req of requirements){
        if(typeof req === 'object'){
            var sat = true;
            for(var subreq of req)
                if(!event.permissions.includes(subreq))
                    sat = false;
            if(sat)
                return sat;
        } else if(event.permissions.includes(req))
            return true;
    }
    return false
}