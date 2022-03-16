import { WorkerRequest } from "../utils/helpers";

/**
 * Class to interact with logging DO to enable websocket logs
 */
 export class Logger{

    afterpost: boolean;
    queue: object[] = [];
    EVENT: WorkerRequest;
    ENV: any;
    loggroup: string;
    lastts: number;
    
    constructor(event: WorkerRequest, env: any, loggroup: string, afterpost: boolean = true){
        this.afterpost = afterpost;
        this.EVENT = event;
        this.ENV = env;
        this.loggroup = loggroup;
        this.lastts = Date.now();
    }

    async log(info: any){
        if(this.afterpost){
            console.log(info);
            this._queue(info);
        } else {
            console.log(info);
            this._post([info]);
        }
    }

    async close(){
        if(this.afterpost)
            this._post(this.queue);
    }

    async _queue(info: any){
        this.queue.push({timestamp: Math.max(this.lastts++, Date.now()), data: info});
    }

    async _post(messages: object[]){
        let id = this.ENV.LOGS.idFromName(this.EVENT.sitename);
        let storage = this.ENV.LOGS.get(id);
        await storage.fetch("https://dummy-url", {
            method: "POST",
            body: JSON.stringify({
                sitename: this.EVENT.sitename,
                endpoint: "logs",
                method: "POST",
                body: JSON.stringify({
                    loggroup: this.loggroup,
                    messages: messages
                })
            })
        });
    }
}