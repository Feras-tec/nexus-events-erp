import { render,screen,waitFor,cleanup } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
import type {ReactNode} from 'react';
vi.mock('@clerk/react',()=>({
 ClerkProvider:({children}:{children:ReactNode})=><div data-testid="explicit-clerk">{children}</div>,
 useAuth:()=>({isLoaded:true,isSignedIn:true,userId:'clerk-fixture',getToken:async()=> 'fixture-token'})
}));
vi.mock('../src/components/providers/AuthQueryProvider',()=>({AuthQueryProvider:({children}:{children:ReactNode})=><>{children}</>}));
import {AppAuthProvider,useAppAuth} from '../src/features/auth/AppAuthProvider';
function Probe(){const auth=useAppAuth();return <div>{auth.mode}:{auth.userId}</div>;}
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('loads Clerk only for explicit fallback after the matching backend handshake',async()=>{
 vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY','pk_test_local_fixture');
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({mode:'clerk'}))));
 render(<AppAuthProvider mode="clerk"><Probe/></AppAuthProvider>);
 await waitFor(()=>expect(screen.getByText('clerk:clerk-fixture')).toBeTruthy());
 expect(screen.getByTestId('explicit-clerk')).toBeTruthy();
});
