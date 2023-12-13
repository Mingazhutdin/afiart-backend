import { SetMetadata } from "@nestjs/common";
import { UserRoleName } from "src/userRole/userRoles.types";

export const HasRoles = (...roles: UserRoleName[]) => SetMetadata("roles", roles);