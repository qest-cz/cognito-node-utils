export type JsonWebKey = {
    alg: string;
    e: string;
    kid: string;
    kty: string;
    n: string;
    use: string;
};

export type CognitoTokenPayload = {
    sub: string;
    aud: string;
    'cognito:groups': string[];
    email_verified: boolean;
    token_use: 'id';
    auth_time: number;
    iss: string;
    'cognito:username': string;
    exp: number;
    iat: number;
    preferred_username?: string;
    email?: string;
};
