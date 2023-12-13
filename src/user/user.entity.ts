import { BaseEntity } from "src/base.entity";
import { Entity, Column, BeforeInsert, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { UserInterface, UserStatus } from "./user.types";
import { hash } from "bcrypt";
import { Confirmation } from "src/confirmation/confirmation.entity";
import { UserRole } from "src/userRole/userRole.entity";


@Entity()
export class User extends BaseEntity implements UserInterface {

    @Column({
        nullable: false,
    })
    fullname: string;

    @Column({
        nullable: false,
        unique: true,
    })
    username: string;

    @Column({
        nullable: false,
        unique: true
    })
    email: string;

    @Column({
        nullable: false
    })
    password: string;

    @Column({
        nullable: false,
    })
    status: UserStatus;

    @ManyToMany(() => UserRole)
    @JoinTable()
    roles: UserRole[]

    @ManyToOne(() => Confirmation)
    emailConfirmation: Confirmation

    @BeforeInsert()
    async hashPassword() {
        this.password = await hash(this.password, 10)
    }
}

