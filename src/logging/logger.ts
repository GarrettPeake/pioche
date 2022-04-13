
// Describes the format of a message
type message = {
    timestamp: number,
    data: any
};

/**
 * Class to interact with logging DO to enable websocket logs
 */
export class Logger{

    live: boolean;
    queue: message[] = [];
    groupingid: string;
    lastts: number;
    env: any;
    
    constructor(groupingid: string, {live = true} = {}){
        this.live = live;
        this.groupingid = groupingid;
        this.lastts = Date.now();
        this.env = globalThis.env;
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

    async _post(messages: message[]){
        // Generate a request that will get properly routed on the other end
        const id = globalThis.env.LOGS.idFromName("logserver");
        const logserver = globalThis.env.LOGS.get(id);
        await logserver.fetch("https://www.dummy-url.com/logs", {
            method: "POST",
            body: JSON.stringify({
                groupingid: this.groupingid,
                messages: messages
            })
        });
    }
}