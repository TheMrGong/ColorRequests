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
     * @param {Discord.HexColorString} color
     * @returns {Promise<IGroupedRole>}
     */
    async function findGroupedRole(guildId, color) {
        return cache.getGroupedRoles(guildId).find(it => it.getRoleColor().hexColor() == color)
    }
}
/**@type {typeof makeFindGroupedRole_} */
export default makeFindGroupedRole