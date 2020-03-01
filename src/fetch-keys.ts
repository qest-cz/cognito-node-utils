import https from 'https';
import { JsonWebKey } from './interfaces';

export const fetchJwkKeys = async (region: string, userPoolId: string): Promise<{ keys: JsonWebKey[] }> => {
    const fetchKeys = (userPoolId: string) =>
        new Promise<string>((resolve, reject) => {
            let body = '';
            https.get(`https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`, (res) => {
                if (res.statusCode !== 200) {
                    reject('User pool not found');
                }

                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    resolve(body);
                });
            });
        });

    const responseBody = await fetchKeys(userPoolId);

    return JSON.parse(responseBody);
};
