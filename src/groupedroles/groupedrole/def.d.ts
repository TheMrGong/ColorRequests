interface IGroupedRole {
    getRoleId(): string
    getRoleColor(): RGBColor

    isDeleting(): boolean
    setDeleting(newDeleting: boolean): void

    clone(): IGroupedRole

    changeColor(newColor: RGBColor): void
}

class GroupedRoleInfo {
    roleId: string
    roleColor: string
}

const makeGroupedRole_: (info: GroupedRoleInfo) => IGroupedRole
const makeRGBColor_: (info: RGBColorInfo) => RGBColor


class MakeGroupedRoleDependencies {
    makeRGBColor: typeof makeRGBColor_
}
const buildMakeGroupedRole_: (MakeGroupedRoleDependencies) => typeof makeGroupedRole_