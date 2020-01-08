//@ts-check

/**
 * 
 * @param {DefaultDependencies} param
 * @returns {typeof getGroupedRole_}
 */
function makeGetGroupedRole({
    cache
}) {
    return getGroupedRole
    /**
     * 
     * @param {string} guildId 
     * @param {string} roleId
     * @returns {Promise<IGroupedRole>}
     */
    async function getGroupedRole(guildId, roleId) {
        return cache.getGroupedRoles(guildId).find(it => it.getRoleId() == roleId)
    }
}
/**@type {typeof makeGetGroupedRole_} */
export default makeGetGroupedRole