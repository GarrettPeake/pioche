import JWT from '@tsndr/cloudflare-worker-jwt';
import * as FUNCTIONALS from '../controllers/functionals';
import { Logger } from '../logging/logger';
import { JResponse, WorkerRequest } from '../utils/helpers';
// Export all of the durable objects
export { ConfigsDurableObject } from '../controllers/configs';
export { UsersDurableObject }   from '../controllers/users';
export { PlaysDurableObject }   from '../controllers/plays';
export { ChatsDurableObject }   from '../controllers/chats';
export { RanksDurableObject }   from '../controllers/ranks';
export { LogsDurableObject }    from '../controllers/logs';
export { StatsDurableObject }   from '../controllers/stats';

// Declare a standardized version of the request
export let EVENT: WorkerRequest = {
    method: null,
    endpoint: null,
    sitename: null,
    id: null,
    params: null,
    headers: null,
    body: null,
    permissions: null
};

export let logger: Logger; // Declare global scope logger

export let ENV; // Export a reference to the current environment

export default{
    /**
     * Entry point for the worker using modules worker syntax
     * @param request Holds information about the HTTP request
     * @param env Holds information about the worker's environment
     * @returns A promise containing a response
     */
    async fetch(request: Request, env) {
        try{
            await parseRequest(request) // Populate the global EVENT
        } catch (e) {
            return new JResponse(400, "fail", {message: "Unable to parse request"}).format();
        }
        logger = new Logger(EVENT, env, EVENT.headers['cf-ray']); // Initialize the global logger
        logger.log('REQUEST RECEIVED AND PARSED');
        logger.log(EVENT); // Log parsed event
        logger.log('BEGIN EXECUTION');
        ENV = env; // Export the environment reference
        
        // Handle preflights first
        if(EVENT.method === "OPTIONS"){
            logger.log("EXECUTING PREFLIGHT RESPONSE")
            return new JResponse(undefined, undefined, undefined, undefined, true).format();
        }
        
        // Delegate to resource endpoints
        if(["CONFIGS", "USERS", "PLAYS", "CHATS", "RANKS", "LOGS", "STATS"].includes(EVENT.endpoint)){
            // Construct a reference to the intended durable object
            let id = ENV[EVENT.endpoint].idFromName(EVENT.sitename);
            let storage = ENV[EVENT.endpoint].get(id);
            // Pass the request to the Durable Object
            logger.log("VALID ROUTING - CALLING STORAGE");
            let resp_val = await storage.fetch("https://dummy-url", {method: "POST", body: JSON.stringify(EVENT)});
            logger.log("STORAGE RETURNED");
            logger.log(resp_val);
            return resp_val
        }
        
        // Delegate to functional endpoints
        else if(EVENT.endpoint in FUNCTIONALS)
            return (await FUNCTIONALS[EVENT.endpoint]()).format();
        else
            return new JResponse(404, 'error', {message: 'No valid resource specified'}).format();
    }
}

/**
 * Extract useful data from the event and format it the same on every request
 * @param request Request object given to worker
 */
async function parseRequest(request: Request){
    // Format the information from the request
    let reqUrl = new URL(String(request.url));
    let route = reqUrl.pathname.split('/').slice(1); // [0] is empty
    EVENT.method = request.method.toUpperCase();
    EVENT.endpoint = route[0].toUpperCase();
    EVENT.sitename = route[1].toUpperCase();
    EVENT.id = route.length > 2 ? route[2].toUpperCase() : null;
    EVENT.params = Object.fromEntries(new URLSearchParams(reqUrl.searchParams));
    EVENT.headers = {}
    for(var entry of request.headers)
        EVENT.headers[entry[0]] = entry[1];
    EVENT.body = await request.json().catch(e=>{}) || {};
    
    // Parse the users JWT
    let jwt = EVENT.headers['authorization'] || null; // Get the JWT from the auth header
    let token = jwt && JWT.verify(jwt, ENV.JWT_KEY) ? JWT.decode(jwt) : {}; // Extract and parse the JSON token
    let ranks_list = token ? token[EVENT.sitename] || [] : []; // Check if we have any ranks on the site
    let ranks = [];
    for(const rank in ranks_list){
        if(rank['exp'] > Date.now()/1000)
        ranks.push(rank['title']);
    }
    EVENT.permissions = ['ifficient'] // TODO: JUST FOR DEBUGGING
}