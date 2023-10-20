import { ConfigModule, ConfigService } from "@nestjs/config";
import { typeOrmModule } from "./typeorm.config";


export const databaseConnection = {
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => typeOrmModule(
        configService.get<string>("DATABASE_HOST"),
        configService.get<number>("DATABASE_PORT"),
        configService.get<string>("DATABASE_USERNAME"),
        configService.get<string>("DATABASE_PASSWORD"),
        configService.get<string>("DATABASE"),
        configService.get<boolean>("DATABASE_SYNCHRONIZE"),
    ),
    inject: [ConfigService]
}