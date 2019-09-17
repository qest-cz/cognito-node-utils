import * as jwt from 'jsonwebtoken';

// tslint:disable-next-line
import jwkToPem = require('jwk-to-pem');

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

export const verifyToken = (idToken: string, jwks: JsonWebKey[]): CognitoTokenPayload => {
    let decodedToken;
    try {
        decodedToken = jwt.decode(idToken, { complete: true });

        if (!decodedToken || !decodedToken.header) {
            throw new Error('Invalid token.');
        }
    } catch (err) {
        throw new InvalidTokenError(err.message);
    }

    const jwk = jwks.find((key) => key.kid === decodedToken.header.kid);
    if (!jwk) {
        throw new NoUsableKeysFoundError('No usable key found in jwks');
    }

    const pem = jwkToPem(jwk);

    try {
        const decodedToken = jwt.verify(idToken, pem, { algorithms: ['RS256'] });

        return decodedToken;
    } catch (err) {
        throw new VerificationFailedError(err.message);
    }
};

export class TokenVerificationError extends Error {}
export class InvalidTokenError extends TokenVerificationError {}
export class NoUsableKeysFoundError extends TokenVerificationError {}
export class VerificationFailedError extends TokenVerificationError {}
