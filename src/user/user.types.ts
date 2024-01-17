import { Confirmation } from "src/confirmation/confirmation.entity";
import { UserRole } from "src/userRole/userRole.entity";

export interface UserInterface {
    id: string;
    fullname: string;
    username: string;
    email: string;
    password: string;
    status: UserStatus;
    roles: UserRole[]
}

export interface UserEntityInterface {
    id: string;
    fullname: string;
    username: string;
    email: string;
    password: string;
    status: UserStatus;
    emailConfirmation: Confirmation;
    roles: UserRole[]
}

export interface UserBody {
    fullname: string;
    username: string;
    email: string;
}

export interface CreateUserInterface extends UserBody {
    password: string
}

export interface ResendSuperAdminPasswordModel {
    password: string
}

export enum UserStatus {
    ON_CHECK = 0,
    ACTIVE = 1,
    INACTIVE = 2,
    DELETED = 3,
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
}

export interface IUserLogin {
    username: string,
    password: string,
}