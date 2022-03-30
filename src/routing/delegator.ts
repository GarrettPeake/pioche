import { generateSession } from '../io/input';
import { Logger } from '../logging/logger';
import { Router } from './router';
// TODO: use config to export all of the controllers

export default{
    /**
     * Entry point for the worker using modules worker syntax
     * @param request Holds information about the HTTP request
     * @param env Holds information about the worker's environment
     * @returns A promise containing a response
     */
    async fetch(request: Request, env: any) {
        let session = generateSession(request)
        let logger = new Logger(session); // Initialize a logger
        logger.log('REQUEST RECEIVED');
        logger.log(session.printout()); // Log parsed event
        logger.log('BEGIN EXECUTION');

        // Make the environment available to the entire framework
        globalThis.env = env;

        // TODO: Run a user provided configuration script
        
        // TODO: Remember to handle preflights 'easyPreflight'
        
        // Route request
        return router.route(session)
    }
}