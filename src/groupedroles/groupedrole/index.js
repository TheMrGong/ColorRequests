//@ts-check

/**
 * @param {MakeGroupedRoleDependencies} param
 */
function buildMakeGroupedRole({ makeRGBColor }) {
    return makeGroupedRole
    /**
     * 
     * @param {GroupedRoleInfo} param
     * @returns {IGroupedRole}
     */
    function makeGroupedRole({ roleId, roleColor }) {
        if (typeof roleId !== "string" || roleId.trim().length == 0) throw new Error("Grouped role must have a role id")
        if (typeof roleColor !== "string" || roleColor.trim().length == 0) throw new Error("Grouped role must have a role color")
        let rgbColor = makeRGBColor({
            color: roleColor
        })

        let deleting = false

        return Object.freeze({
            getRoleId() { return roleId },
            getRoleColor() { return rgbColor },
            changeColor(newColor) {
                if (typeof newColor !== "object") throw new Error("New color must be valid")
                rgbColor = makeRGBColor({ color: newColor.hexColor() })
            },
            isDeleting() {
                return deleting
            },
            setDeleting(newDeleting) {
                deleting = newDeleting
            },
            clone() {
                return makeGroupedRole({ roleId, roleColor })
            }
        })
    }
}


/**@type {typeof buildMakeGroupedRole_} */
export default buildMakeGroupedRole