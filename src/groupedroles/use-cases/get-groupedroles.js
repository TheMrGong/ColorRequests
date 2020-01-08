//@ts-check

/**
 * 
 * @param {DefaultDependencies} param
 * @returns {typeof getGroupedRoles_}
 */
function makeGetGroupedRoles({
    cache
}) {
    return getGroupedRoles
    /**
     * 
     * @param {string} guildId 
     * @returns {Promise<IGroupedRole[]>}
     */
    async function getGroupedRoles(guildId) {
        return cache.getGroupedRoles(guildId)
    }
}
/**@type {typeof makeAddGroupedRole_} */
export default makeGetGroupedRoles