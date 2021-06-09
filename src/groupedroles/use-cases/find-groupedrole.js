//@ts-check

import Discord from "discord.js"

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
     * @param {Discord.Snowflake} guildId 
     * @param {string} color
     * @returns {Promise<IGroupedRole>}
     */
    async function findGroupedRole(guildId, color) {
        return cache.getGroupedRoles(guildId).find(it => it.getRoleColor().hexColor() == color)
    }
}
/**@type {typeof makeAddGroupedRole_} */
export default makeFindGroupedRole