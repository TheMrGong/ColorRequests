class DefaultDependencies {
    cache: IGroupedRoleCache
    groupDatabase: IGroupDatabase
}
class CreateGroupedRoleDependencies extends DefaultDependencies {
    makeGroupedRole: typeof makeGroupedRole_
}
const makeAddGroupedRole_: (dependencies: CreateGroupedRoleDependencies) => typeof addGroupedRole_
const addGroupedRole_: (guildId: string, info: GroupedRoleInfo) => Promise<IGroupedRole | undefined>

const makeDeleteGroupedRole_: (dependencies: DefaultDependencies) => typeof deleteGroupedRole_
const deleteGroupedRole_: (guildId: string, roleId: string) => Promise<IGroupedRole>

const makeGetGroupedRoles_: (dependencies: DefaultDependencies) => typeof getGroupedRoles_
const getGroupedRoles_: (guildId: string, roleId: string) => Promise<IGroupedRole[]>

const makeFindGroupedRole_: (dependencies: DefaultDependencies) => typeof findGroupedRole_
const findGroupedRole_: (guildId: string, color: Discord.HexColorString) => Promise<IGroupedRole>

const makeGetGroupedRole_: (dependencies: DefaultDependencies) => typeof getGroupedRole_
const getGroupedRole_: (guildId: string, roleId: string) => Promise<IGroupedRole>