

//@ts-check

import Discord from "discord.js"
import bot from "../../bot"
import { RGBColor } from "../../util/rgbutil"

/**
 * @param {DepCreateGroupedRole} param 
 * @returns {typeof createGroupedRole_}
 */
export default function makeCreateGroupedRole({ addGroupedRole }) {

    return createGroupedRole
    /**
     * 
     * @param {Discord.Snowflake} guildId 
     * @param {RGBColor} roleColor 
     * @param {string} roleName
     * @returns {Promise<import("discord.js").Role>}
     */
    async function createGroupedRole(guildId, roleColor, roleName) {
        const guild = bot.client.guilds.cache.get(guildId)
        if (!guild) throw new Error("Couldn't find guild!")
        const role = await guild.roles.create({
            color: roleColor.hexColor(),
            hoist: false,
            mentionable: false,
            permissions: [],
            name: roleName,
            position: 1,
            reason: "Creating groupped role"
        })
        await addGroupedRole(guildId, {
            roleColor: roleColor.hexColor(),
            roleId: role.id
        })
        return role
    }
}