import { Controller, Get, Post, Param, Body, UseGuards, Request, ParseUUIDPipe, Put, Delete, NotFoundException } from "@nestjs/common";
import { UserService } from "./user.service";
import { ConfigService } from "@nestjs/config";
import { UserBody } from "./user.types";
import { User } from "./user.entity";

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
    async createUser(@Body() body: UserBody): Promise<User> {
        return await this.userService.createUser(body)
    }

    @Put(":uuid")
    async updateUser(
        @Param("uuid") id: string, @Body() body: UserBody
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
}