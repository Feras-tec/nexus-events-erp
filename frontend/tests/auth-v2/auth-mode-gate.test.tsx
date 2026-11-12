import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthModeGate } from '../../src/features/auth/AuthModeGate';
import { resolveAuthMode } from '../../src/features/auth/mode';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('defaults new builds to Auth-V2 and accepts only explicit consistent fallback',()=>{
 expect(resolveAuthMode({})).toBe('auth-v2');expect(resolveAuthMode({VITE_AUTH_MODE:'clerk'})).toBe('clerk');
 expect(resolveAuthMode({VITE_AUTH_V2_ENABLED:'false'})).toBe('clerk');
 expect(()=>resolveAuthMode({VITE_AUTH_MODE:'typo'})).toThrow();
 expect(()=>resolveAuthMode({VITE_AUTH_MODE:'auth-v2',VITE_AUTH_V2_ENABLED:'false'})).toThrow();
});
it.each(['auth-v2','clerk'] as const)('opens only after a matching %s backend handshake',async mode=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({mode}),{status:200})));
 render(<AuthModeGate mode={mode}><div>protected-child</div></AuthModeGate>);
 await waitFor(()=>expect(screen.getByText('protected-child')).toBeTruthy());
});
it.each(['wrong-mode','unavailable'])('fails closed when backend is %s',async failure=>{
 vi.stubGlobal('fetch',vi.fn(async()=>{if(failure==='unavailable')throw new Error('offline');return new Response(JSON.stringify({mode:'clerk'}));}));
 render(<AuthModeGate mode="auth-v2"><div>protected-child</div></AuthModeGate>);
 await waitFor(()=>expect(screen.getByRole('alert')).toBeTruthy());expect(screen.queryByText('protected-child')).toBeNull();
});
