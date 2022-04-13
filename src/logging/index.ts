
/**
 * Class decorator specifying whether or not to enable log coalescing
 * If enabled, durable object requests will be greatly reduced but faults
 * will prevent any logs from hitting log endpoint
 */
export function LiveLogs(enabled: boolean){
    return function (target: any){
        target.liveLogging = enabled;
    };
}

/** TODO: Implement as session level pointer
 * Function decorator telling the containing controller
 * which durable object to send the logs to based on the session
 * if Durable Object logging is enabled
 */
export function LogTarget(){
    return function(target: any, ) {};
}