import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm/dist";
import { User } from "./user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { Confirmation } from "src/confirmation/confirmation.entity";
import { ConfirmationService } from "src/confirmation/confirmation.service";

@Module({
    imports: [TypeOrmModule.forFeature([User, Confirmation])],
    controllers: [UserController],
    providers: [UserService, ConfirmationService],
})
export class UserModule { }
