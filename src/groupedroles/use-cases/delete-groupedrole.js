//@ts-check

import Discord from "discord.js"

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
     * @param {Discord.Snowflake} guildId 
     * @param {Discord.Snowflake} roleId
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