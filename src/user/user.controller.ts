import { Controller, Get, Post, Param, Body, UseGuards, Request, ParseUUIDPipe, Put, Patch, Delete, NotFoundException } from "@nestjs/common";
import { UserService } from "./user.service";
import { ConfigService } from "@nestjs/config";
import { CreateUserInterface, UserBody } from "./user.types";
import { User } from "./user.entity";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { HasRoles } from "src/auth/roles.decorator";
import { UserRoleName } from "src/userRole/userRoles.types";
import { RolesGuard } from "src/auth/roles.guard";

@Controller("users")
export class UserController {
    constructor(
        private readonly userService: UserService,
        private configService: ConfigService
    ) { }

    @Get()
    findAll() {
        return this.userService.findAll()
    }

    @Get(":uuid")
    async findById(
        @Param("uuid", new ParseUUIDPipe()) id: string
    ): Promise<User | null> {
        return await this.userService.findById(id)
    }

    @Get("byusername/:username")
    async findByUserName(
        @Param("username") username: string
    ): Promise<User | null> {
        return await this.userService.findByUserName(username)
    }

    @Post()
    async createUser(@Body() body: CreateUserInterface): Promise<User> {
        return await this.userService.createUser(body)
    }

    @Put(":uuid")
    async updateUser(
        @Param("uuid") id: string, @Body() body: CreateUserInterface
    ): Promise<User | null> {
        return await this.userService.updateUser(id, body)
    }

    @Delete(":uuid")
    async deleteUser(
        @Param("uuid") id: string
    ): Promise<any> {
        const user = await this.userService.findById(id)
        if (!user) {
            throw new NotFoundException("user does not exist.")
        }
        await this.userService.deleteUser(id)
        return { message: "User deleted successfully." }
    }

    @UseGuards(JwtAuthGuard)
    @Post("confirm/:code")
    async confirmUserEmail(
        @Param("code")
        code: string,
        @Request() { user }
    ) {
        return await this.userService.confirmUserEmail(user.id, code)
    }

    @UseGuards(JwtAuthGuard)
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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch("super-admin/confirm")
    async confirmSuperAdmin(
        @Request()
        { user }
    ) {
        return this.userService.confirmSuperAdmin(user.id)
    }
}