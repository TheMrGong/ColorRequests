//@ts-check

import { addGroupedRole, deleteGroupedRole, getGroupedRoles, findGroupedRole, getGroupedRole } from "./use-cases"
import makeCreateGroupedRole from "./controller/create-groupedrole"
import makeRemoveGroupedRole from "./controller/remove-groupedrole"
import makeHandleLossRole from "./controller/handle-lossrole"
import makeFindGroupRoles from "./controller/find-grouproles"
import { client } from "../bot"

const createGroupedRole = makeCreateGroupedRole({
    addGroupedRole,
    client
})
const removeGroupedRole = makeRemoveGroupedRole({
    deleteGroupedRole,
    client
})
const handleLossRole = makeHandleLossRole({
    deleteGroupedRole,
    getGroupedRole
})
const findGroupRoles = makeFindGroupRoles({
    getGroupedRole
})

const groupedRoles = Object.freeze({
    createGroupedRole,
    removeGroupedRole,
    findGroupedRole,
    getGroupedRoles,
    getGroupedRole,
    handleLossRole,
    findGroupRoles
})

export default groupedRoles
export {
    createGroupedRole,
    removeGroupedRole,
    getGroupedRoles,
    findGroupedRole,
    getGroupedRole,
    handleLossRole,
    findGroupRoles
}