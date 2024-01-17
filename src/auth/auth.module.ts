import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "src/user/user.service";
import { User } from "src/user/user.entity";
import { AuthService } from "./auth.service";
import { UserModule } from "src/user/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";
import { AccessTokenStrategy } from "./strategy/access.strategy";
import { ConfirmationService } from "src/confirmation/confirmation.service";
import { Confirmation } from "src/confirmation/confirmation.entity";
import { UserRoleService } from "src/userRole/UserRole.service";
import { UserRole } from "src/userRole/userRole.entity";
import { RefreshTokenStrategy } from "./strategy/refresh.strategy";
import { ConfirmationModule } from "src/confirmation/confirmation.module";
import { UserRoleModule } from "src/userRole/userRole.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Confirmation, UserRole]),
        PassportModule,
        forwardRef(() => UserModule),
        forwardRef(() => ConfirmationModule),
        forwardRef(() => UserRoleModule),
    ],
    controllers: [],
    providers: [AuthService,
        JwtService,
        UserService,
        AccessTokenStrategy,
        RefreshTokenStrategy,
        ConfirmationService,
        UserRoleService],
    exports: [AuthService]
})
export class AuthModule { }