//@ts-check

import * as sql from "../../util/sql"
import { CREATE_TABLE, QUERY_STATEMENTS } from "./sql"
import makeGroupDb from "./grouped.db"
import buildMakeGroupedRole from "../groupedrole"

import hexToRgb, {RGBColorInfo} from "../../util/rgbutil"

/**
 * 
 * @param {RGBColorInfo} param
 */
function makeRGBColor({ color }) {
    return hexToRgb(color)
}

const makeGroupedRole = buildMakeGroupedRole({
    makeRGBColor
})


const ready = sql.query(CREATE_TABLE)

const db = makeGroupDb({
    query: sql.query,
    queryStatements: QUERY_STATEMENTS,
    makeGroupedRole
})


export { ready }
export default db