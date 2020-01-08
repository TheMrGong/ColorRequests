//@ts-check

/**
 * 
 * @param {DefaultDependencies} param
 * @returns {typeof findGroupedRole_}
 */
function makeFindGroupedRole({
    cache
}) {
    return findGroupedRole
    /**
     * 
     * @param {string} guildId 
     * @param {string} color
     * @returns {Promise<IGroupedRole>}
     */
    async function findGroupedRole(guildId, color) {
        return cache.getGroupedRoles(guildId).find(it => it.getRoleColor().hexColor() == color)
    }
}
/**@type {typeof makeAddGroupedRole_} */
export default makeFindGroupedRole