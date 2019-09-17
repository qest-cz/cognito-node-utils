import bad_jwks from '../test/bad_jwks.json';
import jwks from '../test/jwks.json';
import { InvalidTokenError, NoUsableKeysFoundError, VerificationFailedError, verifyToken } from './verify-token';

const token =
    'eyJraWQiOiJvWVh3VkJHbUpWRGpJbFY4dnlKRmZtQlRxcnBiQUtmTzI3M1wvNVdmeDQ2bz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI5MjIyZDhjNC1jYzk0LTRjNjctODMzYy0zZTgxZWFkYjAzNWEiLCJhdWQiOiIxbTA2aHJtNWVxOG1mdjN1bmhlN2VwajJzYiIsImNvZ25pdG86Z3JvdXBzIjpbInRlYWNoZXIiXSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTU2ODEwNjQ3NiwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LXdlc3QtMS5hbWF6b25hd3MuY29tXC9ldS13ZXN0LTFfemlCR3lwdjduIiwiY29nbml0bzp1c2VybmFtZSI6InRlc3R1c2VyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJleHAiOjE1NjgxMTAwNzYsImlhdCI6MTU2ODEwNjQ3NiwiZW1haWwiOiJ2aXRoYWJhZGE5M0BnbWFpbC5jb20ifQ.ZMpqojGavdx4aHsHyBMsBj11WgAziGgM2BI8IrJaPiun4qnWOgb4IYqBI_8jJaNyCpULh4vZDcKjYdI7zOoKjSWEfm9cZ-PPMaIu0Hce9vY7gLYO6rdBs9qJhmxqTyybF31dYtAR6FEk-YutwOfnZxhLDBP4MEnTb59A0BPiz9LHIS9SNw_5uSE2BPG_fAokAvnAjrVlSM_ie31vdOFCueZbNgMtZXIM7MA2gJZ29bfj-wNLS6Oqo8EDHEIgOYWP_0ttiCdUWPo_J9yxbwwV2Moxi6vvdlToJH2wSaQj6gEAox-0lE87JJ_bHRP3F1_FR3p2-b3rwQnFS1LsvpP3WA';

describe('Token verifier', () => {
    it('should reject invalid token', async () => {
        const token = 'invalid';

        try {
            await verifyToken(token, jwks.keys);
        } catch (err) {
            expect(err).toBeInstanceOf(InvalidTokenError);
        }
    });

    it('should detect bad keys', async () => {
        try {
            await verifyToken(token, bad_jwks.keys);
        } catch (err) {
            expect(err).toBeInstanceOf(NoUsableKeysFoundError);
        }
    });

    it('should reject token signature', async () => {
        try {
            await verifyToken(token, jwks.keys);
        } catch (err) {
            expect(err).toBeInstanceOf(VerificationFailedError);
        }
    });
});
