

//@ts-check

/**
 * @param {DepFindGroupRoles} param 
 * @returns {typeof findGroupRoles_}
 */
export default function makeFindGroupRoles({ getGroupedRole }) {

    return findGroupRoles
    /**
     * 
     * @param {import("discord.js").GuildMember | import("discord.js").PartialGuildMember} member
     * @returns {Promise<import("discord.js").Role[]>}
     */
    async function findGroupRoles(member) {

        let foundGroupRoles = []
        for (let role of member.roles.cache.values()) {
            const groupedRole = await getGroupedRole(member.guild.id, role.id)
            if (groupedRole)
                foundGroupRoles.push(role)
        }
        return foundGroupRoles
    }
}