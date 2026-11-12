import { useEffect, useState, type ReactNode } from "react";
import type { AppAuthMode } from "./mode";

// Bei ungleichen Modi oder unerreichbarem Backend niemals geschützte Inhalte starten.
export function AuthModeGate({mode,children}:{mode:AppAuthMode;children:ReactNode}) {
 const [state,setState]=useState<{mode:AppAuthMode;ok:boolean}|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  const base=mode === "auth-v2" ? "" : (import.meta.env.VITE_API_URL ?? "");
  void fetch(`${base}/api/auth/mode`,{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok) throw new Error("Auth mode unavailable");return response.json();})
   .then(data=>{if(!controller.signal.aborted)setState({mode,ok:data.mode===mode});})
   .catch(()=>{if(!controller.signal.aborted)setState({mode,ok:false});});
  return ()=>controller.abort();
 },[mode]);
 if(!state || state.mode!==mode)return <p role="status">Checking authentication configuration…</p>;
 if(!state.ok)return <div role="alert">Authentication configuration mismatch or backend unavailable. Access is blocked.</div>;
 return children;
}
