import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from "@nestjs/config";
import { configOptions } from './config/service.config';
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConnection } from './config/databaseConnection.config';
import { AuthModule } from './auth/auth.module';
import { ConfirmationModule } from './confirmation/confirmation.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerModuleConnection } from './config/mailerModuleConnection';
import { UserRoleModule } from './userRole/userRole.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    UserRoleModule,
    ConfirmationModule,
    ConfigModule.forRoot(configOptions),
    TypeOrmModule.forRootAsync(databaseConnection),
    MailerModule.forRootAsync(mailerModuleConnection),
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }

