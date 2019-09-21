import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { AdminCreateUserResponse } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import fetch from 'node-fetch';

// polyfill for amazon-cognito-identity-js
(<any>global).fetch = fetch;
(<any>global).navigator = {};

export type CompleteNewPasswordChallengeProps = {
    username: string;
    password: string;
};

export const completeUserNewPasswordChallenge = (pool: CognitoUserPool) => ({
    username,
    password,
}: CompleteNewPasswordChallengeProps): Promise<void> =>
    new Promise((resolve, reject) => {
        // login with fresh user credentials
        const cognitoUser = new CognitoUser({ Username: username, Pool: pool });
        const authenticationDetails = new AuthenticationDetails({ Username: username, Password: password });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: () => resolve(),
            onFailure: reject,

            // complete new password challenge on behalf of the user
            newPasswordRequired: (userAttributes, _) => {
                cognitoUser.completeNewPasswordChallenge(password, userAttributes, {
                    onSuccess: (_) => resolve(),
                    onFailure: reject,
                });
            },
        });
    });

export type CreateUserProps = {
    userPoolId: string;
    username: string;
    password: string;
    attributes?: Record<string, string>;
};

export const createUser = (identityProvider: CognitoIdentityServiceProvider) => async ({
    userPoolId,
    username,
    password,
    attributes = {},
}: CreateUserProps): Promise<AdminCreateUserResponse> => {
    const adminCreateUserParams = {
        Username: username,
        TemporaryPassword: password,
        UserPoolId: userPoolId,
        UserAttributes: Object.keys(attributes).map((Name) => ({
            Name,
            Value: attributes[Name],
        })),
    };

    const result = await identityProvider.adminCreateUser(adminCreateUserParams).promise();

    return result;
};

export type ConfirmUserEmailProps = {
    username: string;
    userPoolId: string;
};

export const confirmUserEmail = (identityProvider: CognitoIdentityServiceProvider) => async ({
    username,
    userPoolId,
}: ConfirmUserEmailProps): Promise<void> => {
    await identityProvider
        .adminUpdateUserAttributes({
            Username: username,
            UserPoolId: userPoolId,
            UserAttributes: [
                {
                    Name: 'email_verified',
                    Value: 'true',
                },
            ],
        })
        .promise();
};
