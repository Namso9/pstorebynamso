'use client';
import { useEffect,useState } from 'react';
export function useLiveData<T>(path:string,initial:T,parse:(value:unknown)=>T) {
  const [value,setValue] = useState(initial);
  useEffect(() => {
    const controller=new AbortController(); let running=false;
    const refresh=async () => {
      if (document.hidden || running) return;
      running=true;
      try { const response=await fetch(path,{cache:'no-store',signal:controller.signal});
        if (!response.ok) return;
        const next=parse(await response.json());
        setValue(current=>JSON.stringify(current)===JSON.stringify(next)?current:next);
      } catch { /* Keep validated public fallback content. */ }
      finally { running=false; }
    };
    void refresh(); const timer=window.setInterval(()=>void refresh(),30000);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange',refresh);};
  },[path,parse]);
  return value;
}
