//@ts-check

/**
 * @param {Object} param
 * @param {typeof query} param.query
 * @param {GroupQueryStatements} param.queryStatements
 * @param {typeof makeGroupedRole_} param.makeGroupedRole
 * @returns {IGroupDatabase}
 */
function makeGroupedDb({ query, makeGroupedRole, queryStatements: { GET_GROUPED_FOR_GUILD, INSERT_OR_UPDATE, REMOVE_GROUPED } }) {

    return Object.freeze({
        getGroupedForGuild,
        insertOrUpdate,
        removeGrouped
    })

    /**
     * @param {string} guildId 
     * @returns {Promise<IGroupedRole[]>}
     * @throws {Error} Error if the database had invalid data
     */
    async function getGroupedForGuild(guildId) {
        const results = await query(GET_GROUPED_FOR_GUILD, [guildId])
        /**@type {IGroupedRole[]} */
        let grouped = []

        for (let k in results) {
            grouped.push(makeGroupedRole(results[k]))
        }
        return grouped
    }

    /**
     * @param {string} guildId 
     * @param {IGroupedRole} groupedRole 
     * @returns {Promise<any>}
     */
    async function insertOrUpdate(guildId, { getRoleId, getRoleColor }) {
        return query(INSERT_OR_UPDATE, [guildId, getRoleId(), getRoleColor().hexColor()])
    }

    /**
     * @param {string} guildId 
     * @returns {Promise<any>}
     */
    async function removeGrouped(guildId, roleId) {
        return query(REMOVE_GROUPED, [guildId, roleId])
    }
}

export default makeGroupedDb