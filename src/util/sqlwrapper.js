//@ts-check

/**
 * @param {import("mysql").Pool} db
 * @returns {function(string, ...array): Promise<any>}
 */

import util from "util"
module.exports = function (db) {
    return util.promisify(db.query).bind(db)
}
