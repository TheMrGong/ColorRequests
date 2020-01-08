

//@ts-check

/**
 * @param {DepHandleLossRole} param 
 * @returns {typeof handleLossRole_}
 */
export default function makeHandleLossRole({ deleteGroupedRole, getGroupedRole }) {

    return handleLossRole
    /**
     * 
     * @param {import("discord.js").GuildMember} member
     * @param {import("discord.js").Role[]} lossRoles
     * @returns {Promise<void>}
     */
    async function handleLossRole(member, lossRoles) {

        for (let lossRole of lossRoles) {
            const remaining = lossRole.members.filter(it => it.id != member.id).size
            if (remaining == 0) {

                const groupedRole = await getGroupedRole(member.guild.id, lossRole.id)
                if (!groupedRole) console.warn("Skipping role " + lossRole.name + ", wasn't grouped role")
                try {
                    if (!groupedRole.isDeleting()) {
                        groupedRole.setDeleting(true)
                        lossRole.delete().catch(e => console.error("Unable to delete loss role", e))
                    }
                    await deleteGroupedRole(member.guild.id, lossRole.id)
                    console.log("User left with grouped role, role has 0 people left, removing")
                } catch (e) {
                    console.warn("Unable to delete group role that lost all its users", e)
                }
            }
        }
    }
}