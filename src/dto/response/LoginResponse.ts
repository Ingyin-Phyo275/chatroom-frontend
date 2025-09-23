export interface loginResponse {
    user : {
        id: string;
    name: string;
    email: string;
    avatar?: string;
    phone_no?: string;
    status?: boolean;
    }
}