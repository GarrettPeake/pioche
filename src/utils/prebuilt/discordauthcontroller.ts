import { DurableObjectController } from "../../controllers/durableobjectcontroller";
import { Session } from "../../io/input";
import { BaseMap, GetMap } from "../../routing";

@BaseMap("/identity")
export class DiscordAuth extends DurableObjectController{

    @GetMap("/identity/discord")
    async handle_redirect(session: Session){
        // requires (code: string)
        // Request authorization token using authorization code
        const payload:any = {
            client_id: this.env.DISCORD_ID,
            client_secret: this.env.DISCORD_KEY,
            grant_type: "authorization_code",
            code: (session.request.query as any).code,
            redirect_uri: "http://www.ifficient.tech/redirect"
        };
        let headers:any = {
            "Content-Type": "application/x-www-form-urlencoded"
        };
        fetch("https://discord.com/api/v8/oauth2/token", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: headers
        }).then(data => data.json()).then(async (resp:any) => {
            session.logger.log(`Received token response: ${JSON.stringify(resp)}`);
            if(resp.hasOwnProperty("access_token")){
                headers = {
                    authorization: `${resp.token_type} ${resp.access_token}`
                };
                return fetch("https://discord.com/api/users/@me", {
                    method: "GET",
                    headers: headers
                }).then(data2 => data2.json()).then((subresp:any) => {
                    session.logger.log(`Received identity response: ${JSON.stringify(subresp)}`);
                    if(subresp.hasOwnProperty("username") && subresp.hasOwnProperty("discriminator") && subresp.hasOwnProperty("email")){
                        const username = `${subresp.username}#${subresp.discriminator}`;
                        // upsertUser(username, '', subresp.email); TODO Fix upsertUser
                        return `User ${username} has been created`;
                    }
                    else
                        return {code: 403, body: {message: "Discord identity request rejected"}};
                }).catch(()=>{return {code: 500, body: {message: "Unable to contact Discord"}};});
            } else {
                return {code: 403, body: {message: "Discord identity request rejected"}};
            }
        }).catch(()=> {return {code: 500, body: {message: "Unable to contact Discord"}};});
    }
}