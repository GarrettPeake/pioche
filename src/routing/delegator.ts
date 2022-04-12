import { Session } from '../io/input';
import { Router } from './router';

/**
 * Entry point for the worker using modules worker syntax
 * @param request Holds information about the HTTP request
 * @param env Holds information about the worker's environment
 * @returns A promise containing a response
 */
export async function handleFetch(request: Request, env: any) {
    let session = new Session(request)
    session.logger.log('REQUEST RECEIVED');

    // Make the environment available to the entire framework
    globalThis.env = env;

    // TODO: Run a user provided configuration script
    
    // TODO: Remember to handle preflights 'easyPreflight'
    
    // Route request
    return Router.route(session)
}

export async function handleScheduled(event: any, env: any) {
    handleFetch(
        // TODO: ADD INTERNAL PERMS TO REQUEST
        new Request(
            "https://www.dummy-url.com/cron?trigger=" + event.cron
        ),
        env
    )
}