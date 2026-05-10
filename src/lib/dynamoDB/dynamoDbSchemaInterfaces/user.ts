export default interface User{
    name: string;
    email: string;
    password: string;
    phoneNumber?: string | null;
    active: boolean;
    registrationLink?: string;
    admin?: boolean;
    statusSetToOff?: boolean;
}