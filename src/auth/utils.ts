// Interface for authorization objects
export interface User{
    roles: string[];
    perms: string[];
    internal: number;
    name: string;
}


/**
 * Create a 6 digit code for a given value at the specified time
 * @param value Value to create a code for
 * @param t Time at which value is created
 * @returns Unique 6 digit code based on time and value
 */
export async function sixDigitHash(value: string, t=null){
    let code:any = String(t || Math.floor(Date.now()/1000/60)) + value + 'ifficient!!'; // Assemble the string for hashing
    code = new TextEncoder().encode(code); // Encode the string to bytes
    return crypto.subtle.digest('SHA-256', code) // Hash the string
        .then(digest => Array.from(new Uint8Array(digest)).map(b => b.toString(10).padStart(2, '0')).join(''))
        .then(intstring => intstring.slice(3, 9));
}

/**
 * Check whether the hash was created from value within m minutes
 * @param value Value which hash should validate
 * @param hash Proving hash
 * @param m Timespan for proof
 * @returns boolean whether hash was generated from value within m minuts
 */
export async function validateHash(value, hash, m){
    let timeCode = Math.floor(Date.now()/1000/60) // Get the unix minute
    for(var i = 0; i < m; i++){
        if(await sixDigitHash(value, timeCode-i) == String(hash)){
            return true
        }
    }
    return false
}