import { DynamicModule, Provider } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Confirmation } from "src/confirmation/confirmation.entity"
import { ConfirmationService } from "src/confirmation/confirmation.service"
import { User } from "src/user/user.entity"
import { UserService } from "src/user/user.service"
import { UserRoleService } from "src/userRole/UserRole.service"
import { UserRole } from "src/userRole/userRole.entity"

type ModuleConfigType = {
    entityImports: DynamicModule,
    providers: Provider[]
}

export const UserAndUserRoleModuleConfig: ModuleConfigType = {
    entityImports: TypeOrmModule.forFeature([User, Confirmation, UserRole]),
    providers: [UserService, ConfirmationService, UserRoleService]
}