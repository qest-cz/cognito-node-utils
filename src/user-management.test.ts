import { CognitoUserPool } from 'amazon-cognito-identity-js';
import AWS, { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { addUserToGroup, createUser, deleteUser, disableUser, enableUser, removeUserFromGroup, updateUser } from './user-management';

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

afterAll(() =>
    Promise.all(
        ['testuser', 'testuser2', 'testuser3'].map(
            (Username) =>
                cognitoidentityserviceprovider
                    .adminDeleteUser({
                        Username,
                        UserPoolId: userPool.getUserPoolId(),
                    })
                    .promise()
                    .catch(() => {}), // tslint:disable-line
        ),
    ),
);

describe('Cognito User Management', () => {
    describe('createUser', () => {
        it('should create new user', async () => {
            const user = await createUser(userPool, cognitoidentityserviceprovider)('testuser', 'ABCabc123/');

            expect(user.User.Username).toBe('testuser');
        });

        it('should auto-confirm user password after creation', async () => {
            const user = await createUser(userPool, cognitoidentityserviceprovider)('testuser2', 'ABCabc123/', true);

            expect(user.User.Username).toBe('testuser2');

            const confirmed = await cognitoidentityserviceprovider
                .adminGetUser({
                    UserPoolId: userPool.getUserPoolId(),
                    Username: 'testuser2',
                })
                .promise();

            expect(confirmed.UserStatus).toBe('CONFIRMED');
        });

        it('should create new user with given attributes', async () => {
            const user = await createUser(userPool, cognitoidentityserviceprovider)('testuser3', 'ABCabc123/', false, [
                {
                    Name: 'email',
                    Value: 'testuser@test.com',
                },
            ]);

            expect(user.User.Username).toBe('testuser3');
            expect(user.User.Attributes).toContainEqual({ Name: 'email', Value: 'testuser@test.com' });
        });
    });

    describe('deleteUser', () => {
        it('should delete user', async () => {
            try {
                await createUser(userPool, cognitoidentityserviceprovider)('testuser', 'ABCabc123/');
            } catch (err) {
                // already exists
            } finally {
                await deleteUser(userPool, cognitoidentityserviceprovider)('testuser');
            }
        });
    });

    describe('updateUser', () => {
        it('should delete user', async () => {
            try {
                await createUser(userPool, cognitoidentityserviceprovider)('testuser', 'ABCabc123/', false, [
                    {
                        Name: 'email',
                        Value: 'testuser@test.com',
                    },
                ]);
            } catch (err) {
                // already exists
            } finally {
                await updateUser(userPool, cognitoidentityserviceprovider)('testuser', [
                    {
                        Name: 'email',
                        Value: 'somethingelse@test.com',
                    },
                ]);
            }

            const user = await cognitoidentityserviceprovider
                .adminGetUser({
                    UserPoolId: userPool.getUserPoolId(),
                    Username: 'testuser',
                })
                .promise();

            expect(user.UserAttributes).toContainEqual({ Name: 'email', Value: 'somethingelse@test.com' });
        });
    });

    describe('user groups', () => {
        it('should add user to group', async () => {
            try {
                await createUser(userPool, cognitoidentityserviceprovider)('testuser', 'ABCabc123/', false, [
                    {
                        Name: 'email',
                        Value: 'testuser@test.com',
                    },
                ]);
            } catch (err) {
                // already exists
            } finally {
                await addUserToGroup(userPool, cognitoidentityserviceprovider)('testuser', 'administrators');
            }

            const response = await cognitoidentityserviceprovider
                .adminListGroupsForUser({
                    UserPoolId: userPool.getUserPoolId(),
                    Username: 'testuser',
                })
                .promise();

            expect(response.Groups.some(({ GroupName }) => GroupName === 'administrators')).toBe(true);
        });

        it('should remove user from group', async () => {
            try {
                await createUser(userPool, cognitoidentityserviceprovider)('testuser', 'ABCabc123/', false, [
                    {
                        Name: 'email',
                        Value: 'testuser@test.com',
                    },
                ]);
            } catch (err) {
                // already exists
            } finally {
                await addUserToGroup(userPool, cognitoidentityserviceprovider)('testuser', 'moderators');

                const response = await cognitoidentityserviceprovider
                    .adminListGroupsForUser({
                        UserPoolId: userPool.getUserPoolId(),
                        Username: 'testuser',
                    })
                    .promise();

                expect(response.Groups.some(({ GroupName }) => GroupName === 'moderators')).toBe(true);
            }

            await removeUserFromGroup(userPool, cognitoidentityserviceprovider)('testuser', 'moderators');

            const response = await cognitoidentityserviceprovider
                .adminListGroupsForUser({
                    UserPoolId: userPool.getUserPoolId(),
                    Username: 'testuser',
                })
                .promise();

            expect(response.Groups.some(({ GroupName }) => GroupName === 'moderators')).toBe(false);
        });
    });

    describe('enable/disable user', () => {
        it('should disable user', async () => {
            try {
                await createUser(userPool, cognitoidentityserviceprovider)('testuser', 'ABCabc123/');
            } catch (err) {
                // already exists
            } finally {
                const response = await cognitoidentityserviceprovider
                    .adminGetUser({
                        UserPoolId: userPool.getUserPoolId(),
                        Username: 'testuser',
                    })
                    .promise();

                expect(response.Enabled).toBe(true);
            }

            await disableUser(userPool, cognitoidentityserviceprovider)('testuser');

            const response = await cognitoidentityserviceprovider
                .adminGetUser({
                    UserPoolId: userPool.getUserPoolId(),
                    Username: 'testuser',
                })
                .promise();

            expect(response.Enabled).toBe(false);
        });

        it('should enable user', async () => {
            try {
                await createUser(userPool, cognitoidentityserviceprovider)('testuser', 'ABCabc123/');
            } catch (err) {
                // already exists
            } finally {
                await disableUser(userPool, cognitoidentityserviceprovider)('testuser');

                const response = await cognitoidentityserviceprovider
                    .adminGetUser({
                        UserPoolId: userPool.getUserPoolId(),
                        Username: 'testuser',
                    })
                    .promise();

                expect(response.Enabled).toBe(false);
            }

            await enableUser(userPool, cognitoidentityserviceprovider)('testuser');

            const response = await cognitoidentityserviceprovider
                .adminGetUser({
                    UserPoolId: userPool.getUserPoolId(),
                    Username: 'testuser',
                })
                .promise();

            expect(response.Enabled).toBe(true);
        });
    });
});
