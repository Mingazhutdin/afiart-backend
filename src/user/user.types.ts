export interface UserInterface {
    id: string;
    fullname: string;
    username: string;
    email: string;
    password: string;
}

export interface UserBody {
    fullname: string;
    username: string;
    email: string;
    password: string
    
}

export enum UserStatus {
    ON_CHECK = 0,
    ACTIVE = 1,
    INACTIVE = 2,
    DELETED = 3,
}