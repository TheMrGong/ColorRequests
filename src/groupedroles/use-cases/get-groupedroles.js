//@ts-check

import Discord from "discord.js"

// fixing up the ColorRequests

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
     * @param {Discord.Snowflake} guildId 
     * @returns {Promise<IGroupedRole[]>}
     */
    async function getGroupedRoles(guildId) {
        return cache.getGroupedRoles(guildId)
    }
}
/**@type {typeof makeGetGroupedRoles_} */
export default makeGetGroupedRoles