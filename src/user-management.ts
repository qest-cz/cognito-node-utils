import fetch from 'node-fetch';

// polyfill for amazon-cognito-identity-js
(<any>global).fetch = fetch;
(<any>global).navigator = {};

import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import {
    AdminCreateUserResponse,
    AdminUpdateUserAttributesResponse,
    AttributeListType,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';

export const addUserToGroup = (pool: CognitoUserPool, identityProvider: CognitoIdentityServiceProvider) => async (
    username: string,
    groupName: string,
): Promise<void> => {
    try {
        await identityProvider
            .adminAddUserToGroup({
                Username: username,
                UserPoolId: pool.getUserPoolId(),
                GroupName: groupName,
            })
            .promise();
    } catch (err) {
        throw err;
    }
};

export const removeUserFromGroup = (pool: CognitoUserPool, identityProvider: CognitoIdentityServiceProvider) => async (
    username: string,
    groupName: string,
): Promise<void> => {
    try {
        await identityProvider
            .adminRemoveUserFromGroup({
                Username: username,
                UserPoolId: pool.getUserPoolId(),
                GroupName: groupName,
            })
            .promise();
    } catch (err) {
        throw err;
    }
};

export const completeUserNewPasswordChallenge = (pool: CognitoUserPool) => (username: string, password: string): Promise<void> =>
    new Promise((resolve, reject) => {
        // login with fresh user credentials
        const cognitoUser = new CognitoUser({ Username: username, Pool: pool });
        const authenticationDetails = new AuthenticationDetails({ Username: username, Password: password });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: () => ({}),
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

export const createUser = (pool: CognitoUserPool, identityProvider: CognitoIdentityServiceProvider) => async (
    username: string,
    password: string,
    autoConfirmPassword: boolean = false,
    attributes: AttributeListType = [],
): Promise<AdminCreateUserResponse> => {
    const adminCreateUserParams = {
        Username: username,
        TemporaryPassword: password,
        UserPoolId: pool.getUserPoolId(),
        UserAttributes: attributes,
    };

    try {
        const result = await identityProvider.adminCreateUser(adminCreateUserParams).promise();

        if (autoConfirmPassword) {
            await completeUserNewPasswordChallenge(pool)(username, password);
        }

        return result;
    } catch (err) {
        throw err;
    }
};

export const disableUser = (pool: CognitoUserPool, identityProvider: CognitoIdentityServiceProvider) => async (username: string) => {
    try {
        await identityProvider
            .adminDisableUser({
                UserPoolId: pool.getUserPoolId(),
                Username: username,
            })
            .promise();
    } catch (err) {
        throw err;
    }
};

export const enableUser = (pool: CognitoUserPool, identityProvider: CognitoIdentityServiceProvider) => async (username: string) => {
    try {
        await identityProvider
            .adminEnableUser({
                UserPoolId: pool.getUserPoolId(),
                Username: username,
            })
            .promise();
    } catch (err) {
        throw err;
    }
};

export const updateUser = (pool: CognitoUserPool, identityProvider: CognitoIdentityServiceProvider) => async (
    username: string,
    attributes: AttributeListType,
): Promise<AdminUpdateUserAttributesResponse> => {
    try {
        const updateResult = await identityProvider
            .adminUpdateUserAttributes({
                UserPoolId: pool.getUserPoolId(),
                UserAttributes: attributes,
                Username: username,
            })
            .promise();

        return updateResult;
    } catch (err) {
        throw err;
    }
};

export const deleteUser = (pool: CognitoUserPool, identityProvider: CognitoIdentityServiceProvider) => async (
    username: string,
): Promise<void> => {
    try {
        await identityProvider
            .adminDeleteUser({
                UserPoolId: pool.getUserPoolId(),
                Username: username,
            })
            .promise();
    } catch (err) {
        throw err;
    }
};
