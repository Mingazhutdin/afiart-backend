import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { UserBody, UserStatus } from "./user.types";
import { hash } from "bcrypt";
import { ConfirmationService } from "src/confirmation/confirmation.service";
import { MailerService } from "@nestjs-modules/mailer/dist";
import { ConfirmationStatus } from "src/confirmation/confirmation.types";


@Injectable()
export class UserService {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly confirmationService: ConfirmationService,
        private readonly mailService: MailerService,
    ) { }


    async findAll(): Promise<User[]> {
        return await this.userRepository.find()
    }

    async findById(id: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: {
                id
            },
            relations: {
                emailConfirmation: true
            }
        })
    }

    async findByUserName(username: string): Promise<User | null> {
        return await this.userRepository.findOneBy({ username })
    }

    async createUser(body: UserBody): Promise<User> {
        const user = new User();
        user.fullname = body.fullname;
        user.username = body.username;
        user.email = body.email;
        user.password = body.password;
        user.status = UserStatus.ON_CHECK;
        const emailConfirmation = await this.confirmationService.createEmailConfirmation();
        user.emailConfirmation = emailConfirmation
        const createdUser = await this.userRepository.save(user)
        await this.mailService.sendMail({
            to: user.email,
            from: this.configService.get<string>("EMAIL"),
            subject: "Confirm your email please.",
            text: `Your confirmation code is ${emailConfirmation.code}`,
            html: ""
        })
        return createdUser
    }

    async confirmUserEmail(userId: string, code: string) {
        const user = await this.findById(userId);
        const emailConfirmation = await this.confirmationService.confirmEmailConfirmation(code, user.emailConfirmation)
        switch (emailConfirmation.confirmationStatus) {
            case ConfirmationStatus.PENDING: {
                throw new HttpException(`Code is incorrect, you have ${emailConfirmation.attempts} attempts`, HttpStatus.NOT_ACCEPTABLE)
            }
            case ConfirmationStatus.DECLINED: {
                throw new HttpException("You don't have attempts anymore, register new email.", HttpStatus.NOT_ACCEPTABLE)
            }
            case ConfirmationStatus.ACTIVATED: {
                await this.userRepository.update(userId, { status: UserStatus.ACTIVE })
                return await this.findById(userId)
            }
        }
    }

    async registerNewEmail(userId: string, email: string) {
        const user = await this.findById(userId);
        if (user.status === UserStatus.DELETED || user.status === UserStatus.INACTIVE) {
            throw new HttpException("User is inactive or was deleted.", HttpStatus.FORBIDDEN)
        }
        try {
            await this.confirmationService.closeConfirmation(user.emailConfirmation.id)
            const emailConfirmation = await this.confirmationService.createEmailConfirmation()
            await this.userRepository.update(user.id, { email, emailConfirmation })
            const updatedUser = await this.findById(user.id)
            await this.mailService.sendMail({
                to: updatedUser.email,
                from: this.configService.get<string>("EMAIL"),
                subject: "Confirm your email please.",
                text: `Your confirmation code is ${emailConfirmation.code}`,
                html: ""
            })
            return updatedUser
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
        }
    }

    async updateUser(id: string, body: UserBody): Promise<User> {
        const user = new User();
        user.fullname = body.fullname;
        user.username = body.username;
        user.email = body.email;
        user.password = await hash(body.password, 10);
        await this.userRepository.update(id, user);
        return this.userRepository.findOne({ where: { id } })
    }

    async deleteUser(id: string): Promise<void> {
        await this.userRepository.delete(id)
    }


}