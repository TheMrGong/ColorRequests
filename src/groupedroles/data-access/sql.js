const TABLE_NAME = "grouped_colors"
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    roleId BIGINT NOT NULL,
    roleColor CHAR(20) NOT NULL,
    PRIMARY KEY (guildId, roleId)
)`

const QUERY_STATEMENTS = {
    GET_GROUPED_FOR_GUILD: `SELECT roleId, roleColor FROM ${TABLE_NAME} WHERE guildId = ?`,
    INSERT_OR_UPDATE:
        `INSERT INTO ${TABLE_NAME} 
            (guildId, roleId, roleColor) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE roleColor = VALUES(roleColor)`,
    REMOVE_GROUPED: `DELETE FROM ${TABLE_NAME} WHERE guildId = ? AND roleId = ?`
}

export { CREATE_TABLE, TABLE_NAME, QUERY_STATEMENTS }