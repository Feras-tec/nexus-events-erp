import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { getAuthMode } from '../src/auth/mode.js';
describe('Primary auth mode selection',()=>{
 it('defaults to Auth-V2 without flags',()=>expect(getAuthMode({})).toBe('auth-v2'));
 it('preserves only explicit Clerk fallback selections',()=>{
  expect(getAuthMode({AUTH_MODE:'clerk'})).toBe('clerk');expect(getAuthMode({AUTH_V2_ENABLED:'false'})).toBe('clerk');
 });
 it.each([{AUTH_MODE:'wrong'},{AUTH_MODE:'clerk',AUTH_V2_ENABLED:'true'},{AUTH_MODE:'auth-v2',AUTH_V2_ENABLED:'false'},{AUTH_V2_ENABLED:'typo'}])('rejects invalid or conflicting configuration %j',env=>expect(()=>getAuthMode(env)).toThrow());
 it('fails startup safely when default Auth-V2 is missing configuration',()=>{
  const r=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e','await import("./src/app.ts")'],{cwd:process.cwd(),env:{PATH:process.env.PATH??'',NODE_ENV:'test',DOTENV_CONFIG_PATH:'/dev/null'},encoding:'utf8',timeout:20000});
  expect(r.status).not.toBe(0);expect(r.stderr).toContain('AUTH_V2_AUTH_SECRET must be set');
 });
});
