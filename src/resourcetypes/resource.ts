import { assertAuth, PermissionedObject, preAuth } from "../auth/prechecks";
import { assertStructure, Logger, WorkerRequest } from "../utils/helpers";

/**
 * Abstract superclass for the different types of resources
 * Only provides function wrappers and logging functionality
 */
export abstract class Resource{
    ENV: any;
    _logger: Logger;

    static routes: string[] = []; // All routes advertised by the given resource
    static liveLogging: boolean = false; // Whether to post each log as they come in

    /**
     * Resolve the event based on it's method and data
     * @param EVENT The WorkerRequest that triggered the worker
     */
    abstract handleRequest(EVENT: WorkerRequest): Promise<Response>;

    /**
     * Log information to the sites defined websocket logger
     * @param info Information to log to the remote
     */
    async log(info: any){
        if(this._logger)
            this._logger.log(info);
        else
            console.log(info);
    }

    /**
     * Authorizes a function to run based on a set of requirements
     * returns a failure Response if authorization fails
     * @param requirements A list of requirements for the action
     * @param funct A function to execute and return if the authorization succeeds
     */
    async authorize(requirements: any, funct: () => Response | Promise<Response>){
        return preAuth(this.EVENT, requirements, funct);
    }

    /**
     * Applies the users ranks to a permissions mask
     * @param permmed A PermissionedObject to resolve
     */
    async assertAuth(permmed: PermissionedObject){
        return assertAuth(this.EVENT, permmed)
    }

    /**
     * 
     * @param format Applies format requirements to the event
     * @returns The formatted event, or false
     */
    async assertEvent(format: any){
        return assertStructure(this.EVENT, format);
    }

}