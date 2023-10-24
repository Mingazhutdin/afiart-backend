import { ConfigModule, ConfigService } from "@nestjs/config"

export const mailerModuleConnection = {
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
        transport: configService.get<string>("EMAIL_TRANSPORT"),
        defaults: {
            from: configService.get<string>("EMAIL_FROM"),
        },
        template: {
            dir: __dirname + '/templates',
            options: {
                strict: true,
            },
        },
    }),
    inject: [ConfigService]
}