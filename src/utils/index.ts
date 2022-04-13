/**
 * Recursively checks a format Object against a given Object
 * For each key in format
 * @param tbf the object to be formatted
 * @param format the required format for object
 *   example:
 *   {
 *       params: {
 *           number: n => typeof n === "string" && n.strip().length === 12,
 *           page: n => typeof n === "int"
 *       },
 *       body: {
 *           message: n => typeof n === "string" && n.length < 255,
 *           subject: n => typeof n === "string" && n.length < 32
 *       }
 *   }
 */
export function assertStructure(tbf: any, format: any){
    for(const key in format){
        if(typeof format[key] === "function"){ // Function check
            if(!format[key](tbf[key])){
                console.log(`assertStructure f fail: key->${key} fval->${format[key]} oval->${tbf[key]}`);
                return false;
            } else
                format[key] = tbf[key];
        }
        if(typeof format[key] === "object"){ // Recursive formatting check
            format[key] = assertStructure(tbf[key], format[key]);
            if(!format[key]){
                console.log(`assertStructure o fail: key->${key} fval->${format[key]} oval->${tbf[key]}`);
                return false;
            }
        }
    }
    return format;
}
