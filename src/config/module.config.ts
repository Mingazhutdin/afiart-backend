import { DynamicModule, ForwardReference, Provider, Type, forwardRef } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "src/auth/auth.module"
import { AuthService } from "src/auth/auth.service"
import { Confirmation } from "src/confirmation/confirmation.entity"
import { ConfirmationService } from "src/confirmation/confirmation.service"
import { User } from "src/user/user.entity"
import { UserService } from "src/user/user.service"
import { UserRoleService } from "src/userRole/UserRole.service"
import { UserRole } from "src/userRole/userRole.entity"

type ModuleConfigType = {
    imports: (ForwardReference<any> | Type<any> | DynamicModule | Promise<DynamicModule>)[],
    providers: Provider[],
    exports: Provider[],
}

export const ModulesConfig: ModuleConfigType = {
    imports: [TypeOrmModule.forFeature([User, Confirmation, UserRole]), forwardRef(() => AuthModule)],
    providers: [UserService, ConfirmationService, UserRoleService, AuthService, JwtService],
    exports: [UserService, ConfigService, AuthService, UserRoleService]
} 