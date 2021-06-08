

//@ts-check

/**
 * @param {DepCreateGroupedRole} param 
 * @returns {typeof createGroupedRole_}
 */
export default function makeCreateGroupedRole({ addGroupedRole, client }) {

    return createGroupedRole
    /**
     * 
     * @param {string} guildId 
     * @param {RGBColor} roleColor 
     * @param {string} roleName
     * @returns {Promise<import("discord.js").Role>}
     */
    async function createGroupedRole(guildId, roleColor, roleName) {
        const guild = client.guilds.cache.get(guildId)
        if (!guild) throw new Error("Couldn't find guild!")
        const role = await guild.roles.create({
            data: {
                color: roleColor.hexColor(),
                hoist: false,
                mentionable: false,
                permissions: 0,
                name: roleName,
                position: 1
            },
            reason: "Creating groupped role"
        })
        await addGroupedRole(guildId, {
            roleColor: roleColor.hexColor(),
            roleId: role.id
        })
        return role
    }
}