/**
 * Check whether the user has the required permissions
 * @param event The formatted request event
 * @param perms A list of requirements
 *  Example: [["configsRead", "viewAny"], "level1"] is level1 || (configsRead && viewAny)
 * @returns boolean whether check passed
 */
export function checkPerms(event, requirements){
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = (...args: any) => {return "TODO: Adding status codes like this not supported yet"};
    };
}