interface IGroupedRoleCache {
    getGroupedRoles(guildId: string): IGroupedRole[] | undefined | null
    addGroupedRole(guildId: string, groupedRole: IGroupedRole): void
    getGroupedRole(guildId: string, roleId: string): IGroupedRole | undefined
    removeGroupedRole(guildId: string, roleId: string): IGroupedRole | undefined
    guildHasBeenLoaded(guildId: string): boolean
    setCache(guildId: string, roles: IGroupedRole[]): void
}