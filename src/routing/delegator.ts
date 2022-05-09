import { OutboundResponse } from "../io";
import { Session } from "../io/input";
import { Router } from "./router";

/**
 * Entry point for the worker using modules worker syntax
 */
export const DefaultHandlers = {
    fetch: async (request: Request, env: any) => {
        // Generate session, response pair
        const session = new Session(request);
        const response = new OutboundResponse();

        // Log entry
        session.logger.log(`HANDLE: ${session.request.method} ${session.request.url}`);

        // Make env global
        globalThis.env = env;
        
        // Let our Router route the request
        return Router.route(session, response);
    },

    scheduled: async (event: any, env: any) => {
        DefaultHandlers.fetch(
            new Request(
                "https://scheduled.io/" + event.cron
            ),
            env
        );
    }
};