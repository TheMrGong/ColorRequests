//@ts-check

/**
 * 
 * @param {DefaultDependencies} param
 * @returns {typeof deleteGroupedRole_}
 */
function makeDeleteGroupedRole({
    cache,
    groupDatabase
}) {
    return removeGroupedRole
    /**
     * 
     * @param {string} guildId 
     * @param {string} roleId
     * @returns {Promise<IGroupedRole | undefined>}
     */
    async function removeGroupedRole(guildId, roleId) {
        const removed = cache.removeGroupedRole(guildId, roleId)
        await groupDatabase.removeGrouped(guildId, roleId)
        return removed
    }
}
/**@type {typeof makeDeleteGroupedRole_} */
export default makeDeleteGroupedRole