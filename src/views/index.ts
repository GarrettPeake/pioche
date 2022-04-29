import { ViewCheck } from "../types";

export * from "./checks";

/**
 * Enforce full-depth structure on data given sample data and a validation class/object  
 * Structure definitions are composable (see example)  
 * Supports inline validation of data through checks or booleans
 * booleans denoted whether the property is required, and do not validate
 * 
 * ```ts
 * class ConfigView{
 *   likesdogs = istype("boolean");
 *   budget = istype("number");
 * }
 * 
 * class UserView{
 *   name = and(istype("string"), lenbti(6, 33));
 *   userconf = ConfigView;
 *   notRequired = false;
 *   required = true;
 * }
 * 
 * let user = View(potentialUserData, UserView);
 * if(user.getStatus() === -1) // Missing data or failing checks
 *   throw Error("Invalid user data provided");
 * ```
 */
export function View<Type>(val: any, view: (new () => Type)): Type{
    // Instantiate built whether 
    let built: any;
    if(typeof view === "function"){
        built = new (view as any)();
    } else if(typeof view === "object") {
        built = Object.assign({}, view);
    } else {
        throw Error("Error creating view, passed view structure must be an object or class");
    }
    built.__report__ = {
        status: 0,
        missing: [],
        failing: [],
        extras: []
    };
    Object.entries(built).forEach(([prop, check]) => {
    if(prop !== "__report__"){ // We don't want to check our report attribute
        if(val.hasOwnProperty(prop)){ // Check if the key exists
            if(typeof check === "boolean" && check){
                built[prop] = val[prop]; // Just copy the value
            } else if(typeof check === "object" || (check as any).toString()[0] === "c"){ // TODO: This is a hack!
                const subView = built[prop] = View(val[prop], check as any); // Evaluate the subview
                // Append access chains to this level's missing, failing, and extra report
                subView.getMissing().forEach((missing: any) => {
                    built.__report__.missing.push([prop].concat(missing));
                });
                subView.getFailing().forEach((failing: any) => {
                    built.__report__.failing.push([prop].concat(failing));
                });
                subView.getExtras().forEach((extra: any) => {
                    built.__report__.extra.push([prop].concat(extra));
                });
            } else { // We are using a ViewCheck function
                if((check as ViewCheck)(val[prop])){
                    built[prop] = val[prop]; // Replace the check with the found value
                } else { // val[prop] failed check
                    built.__report__.failing.push(prop);
                    built[prop] = undefined;
                }
            }
        } else { // val didn't have prop
            if(!(typeof check === "boolean" && !check)){ // Unless it was optional, note that it's missing
                built.__report__.missing.push(prop);
            }
            built[prop] = undefined;
        }
    }
    });

    // Set the status property
    if(built.__report__.missing.length || built.__report__.failing.length)
        built.__report__.status = -1;
    else if (built.__report__.extras.length)
        built.__report__.status = 1;
    
    // Add report accessors
    built.getStatus = () => built.__report__.status;
    built.getMissing = () => built.__report__.missing;
    built.getFailing = () => built.__report__.failing;
    built.getExtras = () => built.__report__.extras;
    return (built as Type);
}