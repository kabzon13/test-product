import { resetPassword, verifyEmail } from './templates';

describe('email templates', () => {
  it('verify email contains url', () => {
    const t = verifyEmail('https://example.com/verify-email?token=abc');
    expect(t.text).toContain('token=abc');
    expect(t.html).toContain('token=abc');
    expect(t.subject.length).toBeGreaterThan(0);
  });

  it('reset password contains url', () => {
    const t = resetPassword('https://example.com/reset-password?token=abc');
    expect(t.text).toContain('token=abc');
    expect(t.html).toContain('token=abc');
  });
});
