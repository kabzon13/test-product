import { generateToken, hashToken } from './token.util';

describe('token.util', () => {
  it('generates unique url-safe tokens', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hash is deterministic and differs from token', () => {
    const t = generateToken();
    expect(hashToken(t)).toEqual(hashToken(t));
    expect(hashToken(t)).not.toEqual(t);
    expect(hashToken(t)).toMatch(/^[a-f0-9]{64}$/);
  });
});
