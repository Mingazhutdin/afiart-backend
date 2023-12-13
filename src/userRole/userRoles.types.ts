export enum UserRoleName {
    ADMIN = "admin_role",
    USER = "user_role",
    SUPER_ADMIN = "super_admin_role",
}

export interface UserRoleEntityInterface {
    roleName: UserRoleName
}