import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository, UpdateResult } from "typeorm";
import { CreateUserInterface, IUserLogin, TokenResponse, UserBody, UserStatus } from "./user.types";
import { hash, compare } from "bcrypt";
import { ConfirmationService } from "src/confirmation/confirmation.service";
import { MailerService } from "@nestjs-modules/mailer/dist";
import { ConfirmationStatus } from "src/confirmation/confirmation.types";
import { UserRoleService } from "src/userRole/UserRole.service";
import { UserRoleName } from "src/userRole/userRoles.types";
import { UserRole } from "src/userRole/userRole.entity";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class UserService {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        @Inject(forwardRef(() => UserService))
        private userRepository: Repository<User>,
        private readonly confirmationService: ConfirmationService,
        private readonly mailService: MailerService,
        private readonly userRoleService: UserRoleService,
        private readonly authService: AuthService
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
                emailConfirmation: true,
                roles: true
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

    async createUser(body: CreateUserInterface): Promise<TokenResponse> {

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
            text: `Your confirmation code is: ${emailConfirmation.code}`,
            html: ""
        })
        const tokens = await this.authService.getTokens(createdUser)
        this.updateRefreshToken(createdUser.id, tokens.refresh_token)

        return tokens;
    }

    async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
        const hashedToken = await hash(refreshToken, 10)
        await this.userRepository.update(id, { refreshToken: hashedToken })
    }

    async signIn(data: IUserLogin): Promise<TokenResponse> {
        const user = await this.findByUserName(data.username);
        if (!user) {
            throw new HttpException("User does not exist.", HttpStatus.NOT_FOUND);
        }
        const isMatch = await compare(data.password, user.password)
        if (!isMatch) {
            throw new HttpException("Password is incorrect.", HttpStatus.UNAUTHORIZED)
        }
        const tokens = await this.authService.getTokens(user);
        await this.updateRefreshToken(user.id, tokens.refresh_token)
        return tokens;
    }

    async logout(id: string): Promise<UpdateResult> {
        return this.userRepository.update(id, { refreshToken: null });
    }

    async refreshTokens(id: string, refreshToken: string) {
        const user = await this.findById(id);
        if (!user || !user.refreshToken) {
            throw new HttpException("Access denied.", HttpStatus.UNAUTHORIZED);
        }
        const isMatch = await compare(refreshToken, user.refreshToken)
        if (!isMatch) {
            throw new HttpException("Access denied.", HttpStatus.UNAUTHORIZED)
        }
        const tokens = await this.authService.getTokens(user);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
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
    /* TODO */

    async createSuperAdmin(body: UserBody) {
        const superAdminRole = await this.checkExistingRole(UserRoleName.SUPER_ADMIN)
        const existingSuperAdmin = await this.findUserByRole(UserRoleName.SUPER_ADMIN, [UserStatus.ON_CHECK, UserStatus.ACTIVE])
        if (existingSuperAdmin.length) {
            throw new HttpException("SuperAdmin User already exist.", HttpStatus.FORBIDDEN)
        }

        const superAdmin = this.generateUser(body)
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

    /*TODO create user with admin role*/
    async updateUserRoleToAdmin(id: string): Promise<User> {
        const adminRole = await this.checkExistingRole(UserRoleName.ADMIN);
        const user = await this.findById(id);

        if (user && adminRole) {
            await this.userRepository
                .createQueryBuilder()
                .relation(User, 'roles')
                .of(user)
                .add(adminRole)
            return await this.findById(id);
        } else {
            throw new HttpException("User or role are not found", HttpStatus.NOT_FOUND)

        }
    }
    /* TODO */


}