import { ViewCheck } from "../types";

// Note: a check throwing an error is equivalent to a failure

// ============= Arithmetic functions =========================================
    /** Greater than */
    export const gt: ViewCheck = (limit: any) => ((value: any) => value > limit);
    /** Greater than or equal to */
    export const gte: ViewCheck = (limit: any) => ((value: any) => value >= limit);
    /** Less than */
    export const lt: ViewCheck = (limit: any) => ((value: any) => value < limit);
    /** Less than or euqal to */
    export const lte: ViewCheck = (limit: any) => ((value: any) => value <= limit);
    /** Between, non-inclusive */
    export const bt: ViewCheck = (limitl: any, limith: any) => ((value: any) => limitl < value && value < limith);
    /** Between, inclusive */
    export const bti: ViewCheck = (limitl: any, limith: any) => ((value: any) => limitl <= value && value <= limith);
    /** Equal to using == */
    export const eq: ViewCheck = (val: any) => ((value: any) => value == val);
    /** Not equal to using != */
    export const neq: ViewCheck = (val: any) => ((value: any) => value != val);
    /** Equal to using === */
    export const eqq: ViewCheck = (val: any) => ((value: any) => value === val);
    /** Not equal to using !== */
    export const neqq: ViewCheck = (val: any) => ((value: any) => value !== val);
    /** Divisble by */
    export const divby: ViewCheck = (val: any) => ((value: any) => (value / val) % 1 === 0);
    /** Not divisble by */
    export const ndivby: ViewCheck = (val: any) => ((value: any) => (value / val) % 1 !== 0);
    /** Factor of */
    export const facof: ViewCheck = (val: any) => ((value: any) => (val / value) % 1 === 0);
    /** Not factor of */
    export const nfacof: ViewCheck = (val: any) => ((value: any) => (val / value) % 1 !== 0);
    /** Is truthy */
    export const truthy: ViewCheck = () => ((value: any) => value ? true : false);
    /** Is falsy */
    export const falsy: ViewCheck = () => ((value: any) => value ? false : true);
// ============= Regex functions ==============================================
    /** Matches regex */
    export const rx: ViewCheck = (regx: any) => ((value: any) => value.test(regx));
    /** Doesn't match regex */
    export const nrx: ViewCheck = (regx: any) => ((value: any) => !value.test(regx));
// ============= Type functions ===============================================
    /** Is typeof */
    export const istype: ViewCheck = (type: any) => ((value: any) => typeof value === type);
    /** Not typeof */
    export const ntstype: ViewCheck = (type: any) => ((value: any) => typeof value !== type);
    /** Is an array, Array.isArray */
    export const isarr: ViewCheck = () => ((value: any) => Array.isArray(value));
    /** Is not an array, !Array.isArray */
    export const nisarr: ViewCheck = () => ((value: any) => !Array.isArray(value));
    /** Is instanceof */
    export const isinstance: ViewCheck = (classtype: any) => ((value: any) => (value instanceof classtype));
    /** Is not instanceof */
    export const nisinstance: ViewCheck = (classtype: any) => ((value: any) => !(value instanceof classtype));
// ============= Functions on arrays ======================================
    /** Is of length */
    export const islen: ViewCheck = (len: number) => ((value: any) => value.length === len);
    /** Not of length */
    export const nislen: ViewCheck = (len: number) => ((value: any) => value.length !== len);
    /** Length between */
    export const lenbt: ViewCheck = (lenl: number, lenh: number) => ((value: any) => value.length > lenl && value.length < lenh);
    /** Length between inclusive */
    export const lenbti: ViewCheck = (lenl: number, lenh: number) => ((value: any) => value.length >= lenl && value.length <= lenh);
    /** Includes value that passes check */
    export const includes: ViewCheck = (check: any) => ((value: any) => value.filter((n: any) => check(n)).length !== 0);
    /** Doesn't include value that passes check */
    export const nincludes: ViewCheck = (check: any) => ((value: any) => value.filter((n: any) => check(n)).length === 0);
    /** Index satisfies the given check */
    export const indexis: ViewCheck = (index: number, check: any) => ((value: any) => check(value[index]));
// ============= Functions on objects ======================================
    /** Has key */
    export const haskey: ViewCheck = (key: any) => ((value: any) => value[key] !== undefined);
    /** Doesn't have key */
    export const nhaskey: ViewCheck = (key: any) => ((value: any) => value[key] === undefined);
// ============= Conditional Functions ========================================
    /** Not undefined */
    export const exists: ViewCheck = () => ((value: any) => value !== undefined);
    /** Is undefined */
    export const nexists: ViewCheck = () => ((value: any) => value === undefined);
    /** Optional, optionally can run check if it does exist */
    export const optional: ViewCheck = (check?: any) => ((value: any) => nexists()(value) || check !== undefined ? check(value) : value !== undefined);

/** All checks are true */
export const and: ViewCheck = (...checks: any[]) => {
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
};

/** Any check is true */
export const or: ViewCheck = (...checks: any[]) => {
    return (value: any) =>{
        for(const check of checks){
            try{
                if(check(value))
                    return true;
            } catch {}
        }
        return false;
    };
};

/** Inverse given check */
export const not: ViewCheck = (check: any) => {
    return (value: any) =>{
        try{
            return !check(value);
        } catch {
            return true;
        }
    };
};