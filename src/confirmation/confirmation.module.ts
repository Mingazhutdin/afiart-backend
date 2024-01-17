import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Confirmation } from "./confirmation.entity";
import { ConfirmationService } from "./confirmation.service";

@Module({
    imports: [TypeOrmModule.forFeature([Confirmation])],
    controllers: [],
    providers: [Confirmation],
    exports: [Confirmation]
})
export class ConfirmationModule { }