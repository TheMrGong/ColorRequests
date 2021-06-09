

//@ts-check

import Discord from "discord.js"

/**
 * @param {DepRemoveGroupedRole} param 
 * @returns {typeof removeGroupedRole_}
 */
export default function makeRemoveGroupedRole({ deleteGroupedRole, client }) {

    return removeGroupedRole
    /**
     * 
     * @param {Discord.Snowflake} guildId 
     * @param {Discord.Snowflake} roleId
     * @returns {Promise<IGroupedRole>}
     */
    async function removeGroupedRole(guildId, roleId) {

        const guild = client.guilds.cache.get(guildId)
        if (!guild) throw new Error("Unable to find guild!")

        const removed = await deleteGroupedRole(guildId, roleId)
        if (!removed) return
        const role = guild.roles.cache.get(roleId)
        if (role) {
            if (!removed.isDeleting()) {
                removed.setDeleting(true)
                role.delete().catch(e => console.warn("Unable to delete role", e))
            }
        } else {
            console.warn("Unable to find group role for guild, color#" + removed.getRoleColor())
        }
        return removed
    }
}