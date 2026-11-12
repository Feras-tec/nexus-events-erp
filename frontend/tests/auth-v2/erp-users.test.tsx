import { cleanup, renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(() => ({mode:'auth-v2', api:vi.fn()}));
vi.mock('../../src/features/auth/AppAuthProvider',() => ({useAppAuth: () => ({mode:mocks.mode,getToken: async () => null})}));
vi.mock('../../src/features/users/context/AppUserContext',() => ({useAppUser: () => ({role:'OWNER'})}));
vi.mock('../../src/services/api',() => ({apiFetch:mocks.api}));
import {useAppUsers} from '../../src/features/users/hooks/useAppUsers';
import {useUpdateAppUser} from '../../src/features/users/hooks/useUpdateAppUser';
function wrapper({children}:{children:React.ReactNode}){
 return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>;
}
beforeEach(() => {mocks.mode='auth-v2';mocks.api.mockReset();mocks.api.mockResolvedValue({json:async()=>({users:[{id:'local',clerkUserId:null}],user:{id:'local'}})});});
afterEach(cleanup);
it('lädt OWNER-Benutzer mit Cookie und ohne Clerk-Token',async()=>{
 const {result}=renderHook(useAppUsers,{wrapper});await waitFor(()=>expect(result.current.isSuccess).toBe(true));
 expect(mocks.api).toHaveBeenCalledWith('/api/users',null);expect(result.current.data?.[0]?.clerkUserId).toBeNull();
});
it('aktualisiert Benutzer mit Cookie und ohne Clerk-Token',async()=>{
 const {result}=renderHook(useUpdateAppUser,{wrapper});await act(async()=>{await result.current.mutateAsync({id:'local',role:'ACCOUNTANT'});});
 expect(mocks.api).toHaveBeenCalledWith('/api/users/local',null,expect.objectContaining({method:'PATCH'}));
});
it('verlangt im Clerk-Modus weiterhin ein Token',async()=>{
 mocks.mode='clerk';const {result}=renderHook(useAppUsers,{wrapper});await waitFor(()=>expect(result.current.isError).toBe(true));expect(mocks.api).not.toHaveBeenCalled();
});
