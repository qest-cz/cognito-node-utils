import { App } from '@aws-cdk/core';
import { CognitoTestStack } from './test-stack';

const app = new App();

new CognitoTestStack(app, 'CognitoTestStack');