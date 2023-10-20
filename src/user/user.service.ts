import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { UserBody, UserStatus } from "./user.types";
import { hash } from "bcrypt";

@Injectable()
export class UserService {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find()
    }

    async findById(id: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: {
                id
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
        const createdUser = await this.userRepository.save(user)
        return createdUser
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