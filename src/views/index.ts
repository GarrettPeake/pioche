import { ViewCheck } from "../types";

export * from "./checks";

/**
 * Enforce full-depth structure on data given sample data and a validation class/object  
 * Structure definitions are composable (see example)  
 * Supports inline validation of data through checks or booleans
 * booleans denoted whether the property is required, and do not validate
 * @param val The object to validate against the view
 * @param view The view class to validate with
 * @returns An instance of the view class filled with passing values from val or undefined
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

    // Create holds for reporting values
    const missing = [];
    const failing = [];

    // Apply the view
    Object.entries(built).forEach(([prop, check]) => {
        if(val.hasOwnProperty(prop)){ // Check if the key exists
            if(typeof check === "boolean" && check){
                built[prop] = val[prop]; // Just copy the value
            } else if(typeof check === "object" || (check as any).toString()[0] === "c"){ // TODO: This is a hack!
                const subView = built[prop] = View(val[prop], check as any); // Evaluate the subview
                // Append access chains to this level's missing and failing report
                missing.concat(subView.getMissing().map((m: any) => [prop].concat(m)));
                missing.concat(subView.getFailing().map((f: any) => [prop].concat(f)));
            } else { // We are using a ViewCheck function
                if((check as ViewCheck)(val[prop])){
                    built[prop] = val[prop]; // Replace the check with the found value
                } else { // val[prop] failed check
                    failing.push(prop);
                    built[prop] = undefined;
                }
            }
        } else { // val didn't have prop
            if(!(typeof check === "boolean" && !check)){ // Unless it was optional, note that it's missing
                missing.push(prop);
            }
            built[prop] = undefined;
        }
    });

    // Set the status property
    let status = 0;
    if(missing.length || failing.length)
        status = -1;

    // Create the report
    built.__report__ = {
        status: status,
        missing: missing,
        failing: failing
    };
    
    // Add report accessors
    built.getStatus = () => built.__report__.status;
    built.getMissing = () => built.__report__.missing;
    built.getFailing = () => built.__report__.failing;
    return (built as Type);
}