
class DepCreateGroupedRole {
    addGroupedRole: typeof addGroupedRole_
    client: import("discord.js").Client
}

const makeCreateGroupedRole_: (dependencies: DepCreateGroupedRole) => typeof createGroupedRole_
const createGroupedRole_: (guildId: string, roleColor: RGBColor, roleName: string) => Promise<import('discord.js').Role>


class DepRemoveGroupedRole {
    deleteGroupedRole: typeof deleteGroupedRole_
    client: import("discord.js").Client
}

const makeRemoveGroupedRole: (dependencies: DepRemoveGroupedRole) => typeof deleteGroupedRole_
const removeGroupedRole_: (guildId: string, roleId: string) => Promise<IGroupedRole>

class DepHandleLossRole {
    deleteGroupedRole: typeof deleteGroupedRole_
    getGroupedRole: typeof getGroupedRole_
}

const makeHandleLossRole_: (dependencies: DepHandleLossRole) => typeof handleLossRole_
const handleLossRole_: (member: import("discord.js").GuildMember, lossRoles: import('discord.js').Role[]) => Promise<void>

class DepFindGroupRoles {
    getGroupedRole: typeof getGroupedRole_
}

const makeFindGroupRoles_: (dependencies: DepFindGroupRoles) => typeof findGroupRoles_
const findGroupRoles_: (member: import("discord.js").GuildMember) => Promise<import("discord.js").Role[]>