import { CognitoUserPool } from 'amazon-cognito-identity-js';
import AWS, { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { completeUserNewPasswordChallenge, confirmUserEmail, createUser } from './user-management';

require('dotenv').config({ path: './env/.env.test' }); // tslint:disable-line

let cognitoidentityserviceprovider: CognitoIdentityServiceProvider;
let userPool: CognitoUserPool;

const REGION = process.env.AWS_DEFAULT_REGION || 'eu-west-1';
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

beforeAll(() => {
    AWS.config.update({
        region: REGION,
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    });

    const output = fs.readFileSync(path.join(__dirname, '..', 'test', 'cdk.output')).toString();

    const USER_POOL_ID = output.match('CognitoTestStack.UserPoolId = (.*)')[1];
    const CLIENT_ID = output.match('CognitoTestStack.FrontendClientId = (.*)')[1];

    cognitoidentityserviceprovider = new CognitoIdentityServiceProvider({
        region: REGION,
        credentials: {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: SECRET_ACCESS_KEY,
        },
    });

    userPool = new CognitoUserPool({
        UserPoolId: USER_POOL_ID,
        ClientId: CLIENT_ID,
    });
});

const wait = (ms: number) => new Promise((resolve, _) => setTimeout(() => resolve(), ms));

describe('Cognito User Management', () => {
    it('should create new user', async () => {
        const user = await createUser(cognitoidentityserviceprovider)({
            userPoolId: userPool.getUserPoolId(),
            username: 'testuser',
            password: 'ABCabc123/',
        });

        expect(user.User.Username).toBe('testuser');
    });

    it('should confirm user password after creation', async () => {
        const username = 'testuser2';
        const password = 'ABCabc123/';

        const user = await createUser(cognitoidentityserviceprovider)({
            username,
            password,
            userPoolId: userPool.getUserPoolId(),
        });

        await wait(1000);

        await completeUserNewPasswordChallenge(userPool)({ username, password });

        const confirmed = await cognitoidentityserviceprovider
            .adminGetUser({
                UserPoolId: userPool.getUserPoolId(),
                Username: 'testuser2',
            })
            .promise();

        expect(user.User.Username).toBe('testuser2');
        expect(confirmed.UserStatus).toBe('CONFIRMED');
    });

    it('should create new user with given attributes', async () => {
        await createUser(cognitoidentityserviceprovider)({
            userPoolId: userPool.getUserPoolId(),
            username: 'testuser3',
            password: 'ABCabc123/',
            attributes: { email: 'testuser3@test.com' },
        });

        const newUser = await cognitoidentityserviceprovider
            .adminGetUser({
                UserPoolId: userPool.getUserPoolId(),
                Username: 'testuser3',
            })
            .promise();

        expect(newUser.Username).toBe('testuser3');
        expect(newUser.UserAttributes).toContainEqual({ Name: 'email', Value: 'testuser3@test.com' });
    });

    it('should confirm user email', async () => {
        await createUser(cognitoidentityserviceprovider)({
            userPoolId: userPool.getUserPoolId(),
            username: 'testuser4',
            password: 'ABCabc123/',
            attributes: { email: 'testuser4@test.com' },
        });

        await confirmUserEmail(cognitoidentityserviceprovider)({
            username: 'testuser4',
            userPoolId: userPool.getUserPoolId(),
        });

        const newUser = await cognitoidentityserviceprovider
            .adminGetUser({
                UserPoolId: userPool.getUserPoolId(),
                Username: 'testuser4',
            })
            .promise();

        expect(newUser.Username).toBe('testuser4');
        expect(newUser.UserAttributes).toContainEqual({ Name: 'email', Value: 'testuser4@test.com' });
        expect(newUser.UserAttributes).toContainEqual({ Name: 'email_verified', Value: 'true' });
    });
});
