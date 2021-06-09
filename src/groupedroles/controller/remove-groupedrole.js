

//@ts-check

import Discord from "discord.js"

import bot from "../../bot"

/**
 * @param {DepRemoveGroupedRole} param 
 * @returns {typeof removeGroupedRole_}
 */
export default function makeRemoveGroupedRole({ deleteGroupedRole }) {

    return removeGroupedRole
    /**
     * 
     * @param {Discord.Snowflake} guildId 
     * @param {Discord.Snowflake} roleId
     * @returns {Promise<IGroupedRole>}
     */
    async function removeGroupedRole(guildId, roleId) {
        const guild = bot.client.guilds.cache.get(guildId)
        if (!guild) throw new Error("Unable to find guild!")

        const removed = await deleteGroupedRole(guildId, roleId)
        if (!removed) return
        const role = await guild.roles.fetch(roleId)
        if (role) {
            if (!removed.isDeleting()) {
                removed.setDeleting(true)
                role.delete(`Grouped role being deleted`).catch(e => console.warn("Unable to delete role", e))
            }
        } else {
            console.warn("Unable to find group role for guild to delete, color#" + removed.getRoleColor().hexColor())
        }
        return removed
    }
}