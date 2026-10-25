# Security policy boundaries

## Robot Lab policy (current)

`index.html` defines the Robot Lab content security policy:

- `default-src 'self'`
- `connect-src 'self'`
- `script-src 'self'` (no `unsafe-eval`)
- `style-src 'self'`
- `object-src 'none'`
- `frame-ancestors 'none'`

This policy is the strict baseline for Robot Lab and is enforced by US-043 checks.

## Third-party policy boundary (future Story Studio)

Story Studio is blocked by US-045 and is not present yet.  
If a third-party component path is introduced later (for example under `third_party/stykanimate/`), it may define its own documented CSP on that path only. Robot Lab policy must remain strict and must not be relaxed to accommodate third-party requirements.
