import { CfnUserPoolGroup, UserPool, UserPoolClient } from '@aws-cdk/aws-cognito';
import { CfnOutput, Construct, Stack } from '@aws-cdk/core';

export class CognitoTestStack extends Stack {
    public readonly userPool: UserPool;
    public readonly frontendClient: UserPoolClient;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.userPool = new UserPool(this, 'UserPool');

        this.frontendClient = new UserPoolClient(this, 'FrontendClient', {
            userPool: this.userPool,
            generateSecret: false,
        });

         new CfnUserPoolGroup(this, 'AdminGroup', {
            userPoolId: this.userPool.userPoolId,
            groupName: 'administrators',
        });

        new CfnUserPoolGroup(this, 'ModGroup', {
            userPoolId: this.userPool.userPoolId,
            groupName: 'moderators',
        });

        new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
        new CfnOutput(this, 'FrontendClientId', { value: this.frontendClient.userPoolClientId });
    }
}