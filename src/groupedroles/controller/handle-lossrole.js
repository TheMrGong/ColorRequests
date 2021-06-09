

//@ts-check

import Discord from "discord.js"

/**
 * @param {DepHandleLossRole} param 
 * @returns {typeof handleLossRole_}
 */
export default function makeHandleLossRole({ deleteGroupedRole, getGroupedRole }) {

    return handleLossRole
    /**
     * 
     * @param {Discord.GuildMember | Discord.PartialGuildMember} member
     * @param {import("discord.js").Role[]} lossRoles
     * @returns {Promise<void>}
     */
    async function handleLossRole(member, lossRoles) {

        // ensure members are fetched
        if(member.guild.memberCount !== member.guild.members.cache.size) {
            await member.guild.members.fetch()
        }
        await member.guild.roles.fetch()

        for (let lossRole of lossRoles) {
            const remaining = lossRole.members.filter(it => it.id !== member.id).size
            if (remaining == 0) {

                const groupedRole = await getGroupedRole(member.guild.id, lossRole.id)
                if (!groupedRole) console.warn("Skipping role " + lossRole.name + ", wasn't grouped role")
                try {
                    if (!groupedRole.isDeleting()) {
                        groupedRole.setDeleting(true)
                        await lossRole.delete(`0 people left in role ${lossRole.name}, cleaning up unused role`).catch(e => console.error("Unable to delete loss role", e))
                    }
                    await deleteGroupedRole(member.guild.id, lossRole.id)
                    console.log(`User left with grouped role ${lossRole.name}, role has 0 people left, removing`)
                } catch (e) {
                    console.warn(`Unable to delete group role ${lossRole.name} that lost all its users`)
                    console.error(e)
                }
            }
        }
    }
}