import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { authorizedGoogleIdentity, driveOriginAllowed, openDriveCredentials, sealDriveCredentials } from '../../functions/src/driveAuthorizationCore';
describe('Autorisation Drive privée', () => {
  it('chiffre les jetons et refuse un autre propriétaire, une autre clé ou une modification', () => {
    const key = randomBytes(32).toString('base64'), credentials = { accessToken: 'temporary-secret', refreshToken: 'offline-secret', expiresAt: 1234 };
    const sealed = sealDriveCredentials(credentials, key, 'google-one');
    expect(sealed).not.toContain('secret'); expect(openDriveCredentials(sealed, key, 'google-one')).toEqual(credentials);
    expect(() => openDriveCredentials(sealed, key, 'google-two')).toThrow();
    expect(() => openDriveCredentials(sealed, randomBytes(32).toString('base64'), 'google-one')).toThrow();
    const edited = Buffer.from(sealed, 'base64'); edited[32] ^= 1;
    expect(() => openDriveCredentials(edited.toString('base64'), key, 'google-one')).toThrow();
  });
  it('exige une identité vérifiée autorisée et le même identifiant Google', () => {
    const payload = { sub: 'google-one', email: 'brewer@example.invalid', email_verified: true };
    expect(authorizedGoogleIdentity(payload, [payload.email], 'google-one')).toBe('google-one');
    expect(authorizedGoogleIdentity(payload, [], 'google-one')).toBeNull();
    expect(authorizedGoogleIdentity(payload, [payload.email], 'other')).toBeNull();
    expect(authorizedGoogleIdentity({ ...payload, email_verified: false }, [payload.email])).toBeNull();
    expect(driveOriginAllowed('https://brew.web.app', 'brew')).toBe(true);
    expect(driveOriginAllowed('https://brew.web.app.attacker.invalid', 'brew')).toBe(false);
    expect(driveOriginAllowed('http://brew.web.app', 'brew')).toBe(false);
  });
});
