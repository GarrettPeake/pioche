import { Session } from "../io/input";
import { Router } from "./router";

/**
 * Entry point for the worker using modules worker syntax
 */
export const DefaultHandlers = {
    fetch: async (request: Request, env: any) => {
        const session = new Session(request);
        session.logger.log("REQUEST RECEIVED");

        // Make the environment available to the entire framework
        globalThis.env = env;
        
        // Route request
        return Router.route(session);
    },

    scheduled: async (event: any, env: any) => {
        DefaultHandlers.fetch(
            // TODO: ADD INTERNAL PERMS TO REQUEST
            new Request(
                "https://www.dummy-url.com/cron?trigger=" + event.cron
            ),
            env
        );
    }
};