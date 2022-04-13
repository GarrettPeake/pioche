
// Note: a check throwing an error is equivalent to a failure

// ============= Arithmetic functions =========================================
    /** Greater than */
    export const gt = (limit: any) => ((value: any) => value > limit);
    /** Greater than or equal to */
    export const gte = (limit: any) => ((value: any) => value >= limit);
    /** Less than */
    export const lt = (limit: any) => ((value: any) => value < limit);
    /** Less than or euqal to */
    export const lte = (limit: any) => ((value: any) => value <= limit);
    /** Between, non-inclusive */
    export const bt = (limitl: any, limith: any) => ((value: any) => limitl < value && value < limith);
    /** Between, inclusive */
    export const bti = (limitl: any, limith: any) => ((value: any) => limitl <= value && value <= limith);
    /** Equal to using == */
    export const eq = (val: any) => ((value: any) => value == val);
    /** Not equal to using != */
    export const neq = (val: any) => ((value: any) => value != val);
    /** Equal to using === */
    export const eqq = (val: any) => ((value: any) => value === val);
    /** Not equal to using !== */
    export const neqq = (val: any) => ((value: any) => value !== val);
    /** Divisble by */
    export const divby = (val: any) => ((value: any) => (value / val) % 1 === 0);
    /** Not divisble by */
    export const ndivby = (val: any) => ((value: any) => (value / val) % 1 !== 0);
    /** Factor of */
    export const facof = (val: any) => ((value: any) => (val / value) % 1 === 0);
    /** Not factor of */
    export const nfacof = (val: any) => ((value: any) => (val / value) % 1 !== 0);
// ============= Regex functions ==============================================
    /** Matches regex */
    export const rx = (regx: any) => ((value: any) => value.test(regx));
    /** Doesn't match regex */
    export const nrx = (regx: any) => ((value: any) => !value.test(regx));
// ============= Type functions ===============================================
    /** Is typeof */
    export const istype = (type: any) => ((value: any) => typeof value === type);
    /** Not typeof */
    export const ntstype = (type: any) => ((value: any) => typeof value !== type);
    /** Is an array, Array.isArray */
    export const isarr = () => ((value: any) => Array.isArray(value));
    /** Is not an array, !Array.isArray */
    export const nisarr = () => ((value: any) => !Array.isArray(value));
    /** Is instanceof */
    export const isinstance = (classtype: any) => ((value: any) => (value instanceof classtype));
    /** Is not instanceof */
    export const nisinstance = (classtype: any) => ((value: any) => !(value instanceof classtype));
// ============= Functions on arrays ======================================
    /** Is of length */
    export const islen = (len: any) => ((value: any) => value.length === len);
    /** Not of length */
    export const nislen = (len: any) => ((value: any) => value.length !== len);
    /** Includes value that passes check */
    export const includes = (check: any) => ((value: any) => value.filter((n: any) => check(n)).length !== 0);
    /** Doesn't include value that passes check */
    export const nincludes = (check: any) => ((value: any) => value.filter((n: any) => check(n)).length === 0);
    /** Index satisfies the given check */
    export const indexis = (index: number, check: any) => ((value: any) => check(value[index]));
// ============= Functions on objects ======================================
    /** Has key */
    export const haskey = (key: any) => ((value: any) => value[key] !== undefined);
    /** Doesn't have key */
    export const nhaskey = (key: any) => ((value: any) => value[key] === undefined);
// ============= Conditional Functions ========================================
    /** Exists */
    export const exists = () => ((value: any) => value !== undefined);
    /** Does not exist */
    export const nexists = () => ((value: any) => value === undefined);
    /** Optional, optionally can run check if it does exist */
    export const optional = (check?: any) => ((value: any) => nexists()(value) || check !== undefined ? check(value) : value !== undefined);

/** All checks are true */
export function and(...checks: any[]){
    return (value: any) =>{
        for(const check of checks){
            try{
                if(!check(value))
                    return false;
            } catch {
                return false;
            }
        }
        return true;
    };
}

/** Any check is true */
export function or(...checks: any[]){
    return (value: any) =>{
        for(const check of checks){
            try{
                if(check(value))
                    return true;
            } catch {}
        }
        return false;
    };
}

/** Inverse given check */
export function not(check: any){
    return (value: any) =>{
        try{
            return !check(value);
        } catch {
            return true;
        }
    };
}