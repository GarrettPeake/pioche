import { env } from 'TODO WHERE DO WE IMPORT ENV FROM'

/**
 * Class to interact with logging DO to enable websocket logs
 */
 export class Logger{

    live: boolean;
    queue: object[] = [];
    sessionid: string;
    lastts: number;
    
    constructor(session: ClientSession, live: boolean = true){
        this.live = live;
        this.sessionid = session.sessionid;
        this.lastts = Date.now();
    }

    async log(info: any){
        if(this.live){
            console.log(info);
            this._post([info]);
        } else {
            console.log(info);
            this._queue(info);
        }
    }

    async close(){
        if(!this.live)
            this._post(this.queue);
    }

    async _queue(info: any){
        this.queue.push({timestamp: Math.max(this.lastts++, Date.now()), data: info});
    }

    async _post(messages: object[]){
        let id = env.LOGS.idFromName("logserver");
        let storage = env.LOGS.get(id);
        await storage.fetch("https://dummy-url", {
            method: "POST",
            body: JSON.stringify({
                sitename: this.EVENT.sitename, // This is routing information since this request will be handled like all the rest
                endpoint: "logs",
                method: "POST",
                body: JSON.stringify({
                    sessionid: this.sessionid,
                    messages: messages
                })
            })
        });
    }
}