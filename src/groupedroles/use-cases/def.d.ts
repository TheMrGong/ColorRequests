class DefaultDependencies {
    cache: IGroupedRoleCache
    groupDatabase: IGroupDatabase
}
class CreateGroupedRoleDependencies extends DefaultDependencies {
    makeGroupedRole: typeof makeGroupedRole_
}
const makeAddGroupedRole_: (dependencies: CreateGroupedRoleDependencies) => typeof addGroupedRole_
const addGroupedRole_: (guildId: `${bigint}`, info: GroupedRoleInfo) => Promise<IGroupedRole | undefined>

const makeDeleteGroupedRole_: (dependencies: DefaultDependencies) => typeof deleteGroupedRole_
const deleteGroupedRole_: (guildId: `${bigint}`, roleId: `${bigint}`) => Promise<IGroupedRole>

const makeGetGroupedRoles: (dependencies: DefaultDependencies) => typeof deleteGroupedRole_
const getGroupedRoles_: (guildId: `${bigint}`, roleId: `${bigint}`) => Promise<IGroupedRole[]>

const makeFindGroupedRole_: (dependencies: DefaultDependencies) => typeof deleteGroupedRole_
const findGroupedRole_: (guildId: `${bigint}`, color: string) => Promise<IGroupedRole>

const makeGetGroupedRole_: (dependencies: DefaultDependencies) => typeof deleteGroupedRole_
const getGroupedRole_: (guildId: `${bigint}`, roleId: `${bigint}`) => Promise<IGroupedRole>