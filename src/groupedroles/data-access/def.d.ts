class GroupQueryStatements {
    GET_GROUPED_FOR_GUILD: StringifyOptions
    INSERT_OR_UPDATE: string
    REMOVE_GROUPED: string
}

interface IGroupDatabase {
    getGroupedForGuild(guildId: string): Promise<IGroupedRole[]>
    insertOrUpdate(guildId: string, groupedRole: IGroupedRole): Promise<any>
    removeGrouped(guildId: string, roleId: string): Promise<any>
}

const query: (query: string, ...params: any) => Promise<any>