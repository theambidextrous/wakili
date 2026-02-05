export interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}

export interface WakiliUser {
    id: number;
    username: string;
    name: string;
    email: string;
    email_verified: boolean;
    created_at: string;
}

export interface Chat {
    id: number;
    title: string;
    date: string;
    preview: string;
}
