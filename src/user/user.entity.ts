import { BaseEntity } from "src/base.entity";
import { Entity, Column, BeforeInsert, ManyToOne } from "typeorm";
import { UserInterface, UserStatus } from "./user.types";
import { hash } from "bcrypt";
import { Confirmation } from "src/confirmation/confirmation.entity";


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

    @ManyToOne(() => Confirmation)
    emailConfirmation: Confirmation

    @BeforeInsert()
    async hashPassword() {
        this.password = await hash(this.password, 10)
    }
}
