import { Session } from "../io/input";
import { PermissionedObject } from "../types";

/** TODO: Convert to decorator
 * Authorize an action using permissioning
 * @param event A session object
 * @param authobj An object representing permissions required for the action
 * @returns A non-auth response or the result of the action
 */
export async function assertPerms(session: Session, authobj){
    console.log("TODO: assertPerms Function not implement");
}

/**
 * Scrape permissioned data from an object 
 * @param session The requests session object
 * @param permmedobj An object with a data an permissions mask
 * @returns A copy of the object with data requiring higher perms removed
 */
export async function maskPerms(session: Session, permmedobj: PermissionedObject){
    console.log("TODO: maskperms Function not implement");
}

/**
 * Check whether the user has the required permissions
 * @param event The formatted request event
 * @param perms A list of requirements
 *  Example: [["configsRead", "viewAny"], "level1"] is level1 || (configsRead && viewAny)
 * @returns boolean whether check passed
 */
export function checkPerms(event, requirements){
    console.log("TODO: checkPerms Function not implement");
}