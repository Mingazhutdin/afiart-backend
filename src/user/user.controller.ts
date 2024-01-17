import { Controller, Get, Post, Param, Body, UseGuards, Request, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserInterface, IUserLogin, TokenResponse, UserBody } from "./user.types";
import { AccessTokenGuard } from "src/auth/guards/access.guard";
import { HasRoles } from "src/auth/roleGuardAndDecorator/roles.decorator";
import { UserRoleName } from "src/userRole/userRoles.types";
import { RolesGuard } from "src/auth/roleGuardAndDecorator/roles.guard";
import { RefreshTokenGuard } from "src/auth/guards/refresh.guard";

@Controller("users")
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) { }

    @Get()
    findAll() {
        return this.userService.findAll()
    }

    @Post("signup")
    async createUser(@Body() body: CreateUserInterface): Promise<TokenResponse> {
        return await this.userService.createUser(body)
    }

    @Post('signin')
    signIn(@Body() data: IUserLogin): Promise<TokenResponse> {
        return this.userService.signIn(data);
    }

    @UseGuards(AccessTokenGuard)
    @Get('logout')
    logout(@Request()
    { user }
    ) {
        return this.userService.logout(user.id);
    }

    @Get("refresh")
    @UseGuards(RefreshTokenGuard)
    refreshTokens(
        @Request()
        { user }
    ) {
        return this.userService.refreshTokens(user.id, user.refreshToken)
    }

    @UseGuards(AccessTokenGuard)
    @Post("confirm/:code")
    async confirmUserEmail(
        @Param("code")
        code: string,
        @Request() { user }
    ) {
        return await this.userService.confirmUserEmail(user.id, code)
    }

    @UseGuards(AccessTokenGuard)
    @Post("update/email/:email")
    async registerNewEmail(
        @Param("email")
        email: string,
        @Request()
        { user }
    ) {
        return await this.userService.registerNewUserEmail(user.id, email)
    }

    @Post("super-admin")
    async createSuperAdmin(
        @Body() user: UserBody
    ) {
        return await this.userService.createSuperAdmin(user)
    }

    @Patch("super-admin/email/:email")
    async updateSuperAdminEmail(
        @Param("email")
        email: string
    ) {
        return this.userService.changeSuperAdminEmail(email)
    }

    @Patch("super-admin/password")
    async resendSuperAdminPassword() {
        return this.userService.resendSuperAdminPassword()
    }

    @HasRoles(UserRoleName.SUPER_ADMIN)
    @UseGuards(AccessTokenGuard, RolesGuard)
    @Patch("super-admin/confirm")
    async confirmSuperAdmin(
        @Request()
        { user }
    ) {
        return this.userService.confirmSuperAdmin(user.id)
    }

    @HasRoles(UserRoleName.SUPER_ADMIN)
    @UseGuards(AccessTokenGuard, RolesGuard)
    @Patch("create-admin/:uuid")
    async updateUserToAdminRole(
        @Param("uuid")
        id: string
    ) {
        return await this.userService.updateUserRoleToAdmin(id)
    }
}