import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from "@nestjs/config";
import { configOptions } from './config/service.config';
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConnection } from './config/databaseConnection.config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot(configOptions),
    TypeOrmModule.forRootAsync(databaseConnection)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
