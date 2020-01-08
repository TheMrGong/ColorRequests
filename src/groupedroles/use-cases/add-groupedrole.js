//@ts-check

/**
 * 
 * @param {CreateGroupedRoleDependencies} param
 * @returns {typeof addGroupedRole_}
 */
function makeCreateGroupedRole({
    cache,
    groupDatabase,
    makeGroupedRole
}) {
    return createGroupedRole
    /**
     * 
     * @param {string} guildId 
     * @param {GroupedRoleInfo} info 
     * @returns {Promise<IGroupedRole | undefined>}
     */
    async function createGroupedRole(guildId, info) {
        const groupedRole = makeGroupedRole(info)

        const existingGroupedRole = cache.getGroupedRole(guildId, groupedRole.getRoleId())
        await groupDatabase.insertOrUpdate(guildId, groupedRole)
        if (existingGroupedRole) {
            const previous = existingGroupedRole.clone()
            existingGroupedRole.changeColor(groupedRole.getRoleColor())
            return previous
        } else cache.addGroupedRole(guildId, groupedRole)
    }
}
/**@type {typeof makeAddGroupedRole_} */
export default makeCreateGroupedRole