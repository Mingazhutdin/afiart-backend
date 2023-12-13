import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { CreateUserInterface, UserBody, UserStatus } from "./user.types";
import { hash } from "bcrypt";
import { ConfirmationService } from "src/confirmation/confirmation.service";
import { MailerService } from "@nestjs-modules/mailer/dist";
import { ConfirmationStatus } from "src/confirmation/confirmation.types";
import { UserRoleService } from "src/userRole/UserRole.service";
import { UserRoleName } from "src/userRole/userRoles.types";
import { UserRole } from "src/userRole/userRole.entity";


@Injectable()
export class UserService {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly confirmationService: ConfirmationService,
        private readonly mailService: MailerService,
        private readonly userRoleService: UserRoleService
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
        return (await this.userRepository.find({
            where: {
                username
            },
            relations: {
                roles: true
            }
        }))[0]
    }

    async findUserByRole(roleName: UserRoleName, statuses: UserStatus[]): Promise<User[]> {
        return this.userRepository
            .createQueryBuilder("user")
            .innerJoinAndSelect(
                "user.roles", "user_role", "user_role.roleName = :roleName AND user.status in (:...statuses)",
                { roleName, statuses }
            )
            .getMany()
    }

    private generateUser(body: UserBody): User {
        const user = new User();
        user.fullname = body.fullname;
        user.username = body.username;
        user.email = body.email;
        user.status = UserStatus.ON_CHECK;
        return user
    }

    private async checkExistingRole(role: UserRoleName): Promise<UserRole> {
        const userRole = await this.userRoleService.findRoleByRoleName(role)
        if (!userRole) {
            throw new HttpException("User role does not exists.", HttpStatus.INTERNAL_SERVER_ERROR)
        }
        return userRole
    }

    async createUser(body: CreateUserInterface): Promise<User> {

        const userRole = await this.checkExistingRole(UserRoleName.USER)
        const user = this.generateUser(body)
        user.password = body.password;
        user.roles = [userRole]
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


    async registerNewUserEmail(userId: string, email: string) {
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

    /*TODO CHANGE UPDATE METHOD*/
    async updateUser(id: string, body: CreateUserInterface): Promise<User> {
        const user = new User();
        user.fullname = body.fullname;
        user.username = body.username;
        user.email = body.email;
        user.password = await hash(body.password, 10);
        await this.userRepository.update(id, user);
        return this.userRepository.findOne({ where: { id } })
    }
    /*TODO*/

    async createSuperAdmin(body: UserBody) {
        const superAdminRole = await this.checkExistingRole(UserRoleName.SUPER_ADMIN)
        const existingSuperAdmin = await this.findUserByRole(UserRoleName.SUPER_ADMIN, [UserStatus.ON_CHECK, UserStatus.ACTIVE])
        if (existingSuperAdmin.length) {
            throw new HttpException("SuperAdmin User already exist.", HttpStatus.FORBIDDEN)
        }

        const superAdmin = await this.generateUser(body)
        const randomPassword = (await hash(Math.random().toString(), 3)).slice(0, 8)
        superAdmin.password = randomPassword
        superAdmin.roles = [superAdminRole]

        const createdSuperAdmin = await this.userRepository.save(superAdmin)

        await this.mailService.sendMail({
            to: superAdmin.email,
            from: this.configService.get<string>("EMAIL"),
            subject: "Confirm your email please!",
            text: `Your password is: ${randomPassword}, enter your password to activate your account.`,
            html: ""
        })

        return createdSuperAdmin
    }

    private async findExistingOnCheckSuperAdmin(): Promise<User> {
        const superAdminList = await this.findUserByRole(UserRoleName.SUPER_ADMIN, [UserStatus.ON_CHECK])
        if (!superAdminList.length) {
            throw new HttpException("Access denied", HttpStatus.FORBIDDEN)
        }
        return superAdminList[0]

    }
    /*TODO create method to change super admin email */
    async changeSuperAdminEmail(email: string) {
        const { id } = await this.findExistingOnCheckSuperAdmin()
        await this.userRepository.update(id, { email })
        return this.findById(id)
    }
    /*TODO  */

    /* TODO resent password to super admin email */
    /*NEED TO CHECK*/
    async resendSuperAdminPassword() {
        const superAdmin = await this.findExistingOnCheckSuperAdmin()
        const password = (await hash(Math.random().toString(), 3)).slice(0, 8)
        this.userRepository.update(superAdmin.id, { password })
        await this.mailService.sendMail({
            to: superAdmin.email,
            from: this.configService.get<string>("EMAIL"),
            subject: "Confirm your email please!",
            text: `Your password has been changed to: ${password}, enter your password to activate your account.`,
            html: ""
        })
        return this.findById(superAdmin.id)
    }
    /* TODO  */

    async confirmSuperAdmin(userId: string) {
        await this.userRepository.update(userId, { status: UserStatus.ACTIVE })
        return this.findById(userId)
    }

    async deleteUser(id: string): Promise<void> {
        await this.userRepository.delete(id)
    }


}