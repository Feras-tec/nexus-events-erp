import { erpAuthRedirect } from "../../src/features/auth-v2/routing/erp-redirect";
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authEntryFallback } from '../../config/auth-entry-fallback';
import { requiresDocumentNavigation } from '../../src/features/auth-v2/context/navigation';
import { safeReturnTo } from '../../src/features/auth-v2/lib/validation';
import { subscribeToSessionExpiry, subscribeToSessionPolicy } from '../../src/features/auth-v2/api/client';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('Getrennte ERP- und Auth-Einstiege', () => {
  it.each(['/products','/events','/invoices','/dashboard'])('wechselt für %s das Dokument', path => {
    expect(requiresDocumentNavigation(path)).toBe(true);
  });
  it.each(['/auth-v2.html','/auth-v2','/auth-v2/sign-in','/auth-v2/account/security'])('behält %s im Auth-Router', path => {
    expect(requiresDocumentNavigation(path)).toBe(false);
  });
  it.each(['https://evil.test','//evil.test','/\\evil.test'])('verwirft unsichere Rücksprungadresse %s', path => {
    expect(safeReturnTo(path,'/dashboard')).toBe('/dashboard');
  });
  it.each(['configureServer','configurePreviewServer'] as const)('liefert im %s den richtigen HTML-Einstieg', hook => {
    let middleware: (req: any,res: unknown,next: () => void) => void = () => {};
    const plugin = authEntryFallback();
    (plugin[hook] as Function)({middlewares:{use: (fn: typeof middleware) => { middleware=fn; }}});
    for (const [method,url,accept,expected] of [
      ['GET','/auth-v2/sign-in?returnTo=%2Fproducts','text/html','/auth-v2.html?returnTo=%2Fproducts'],
      ['HEAD','/auth-v2/account/security','text/html','/auth-v2.html'],
      ['GET','/products','text/html','/products'],
      ['GET','/api/auth-v2/account/me','application/json','/api/auth-v2/account/me'],
      ['POST','/auth-v2/sign-in','text/html','/auth-v2/sign-in'],
      ['GET','/auth-v2-malicious','text/html','/auth-v2-malicious'],
    ]) {
      const req={method,url,headers:{accept}}; const next=vi.fn();
      middleware(req,{},next); expect(req.url).toBe(expected);expect(next).toHaveBeenCalledOnce();
    }
  });
});
describe('ERP-Sitzungsfehler', () => {
  it('meldet 401 und MFA an den bestehenden Provider, ohne Clerk-Token zu senden',async () => {
    vi.stubEnv('VITE_AUTH_V2_ENABLED','true');
    const {apiFetch}=await import('../../src/services/api');
    const expired=vi.fn(),policy=vi.fn();
    const stop=subscribeToSessionExpiry(expired), stopPolicy=subscribeToSessionPolicy(policy);
    const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({error:'ACCOUNT_INACTIVE'}),{status:401}))
      .mockResolvedValueOnce(new Response(JSON.stringify({error:'MFA_ENROLLMENT_REQUIRED'}),{status:403}));
    vi.stubGlobal('fetch',fetchMock);
    try {
      await expect(apiFetch('/api/products','clerk-token')).rejects.toMatchObject({status:401});
      await expect(apiFetch('/api/products',null)).rejects.toMatchObject({status:403});
      expect(expired).toHaveBeenCalledWith('ACCOUNT_INACTIVE');expect(policy).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false);
    } finally {stop();stopPolicy();}
  });
});

it('priorisiert Sitzungsablauf und MFA vor der anonymen ERP-Weiterleitung', () => {
 expect(erpAuthRedirect('expired','IDLE_EXPIRED','/products')).toBe('/auth-v2/session-expired?reason=IDLE_EXPIRED');
 expect(erpAuthRedirect('mfa-enrollment-required',null,'/products')).toBe('/auth-v2/mfa/enroll');
 expect(erpAuthRedirect('anonymous',null,'/invoices?status=DRAFT')).toBe('/auth-v2/sign-in?returnTo=%2Finvoices%3Fstatus%3DDRAFT');
});
