import { useEffect,useRef } from 'react';
export function useAdminDialog(open:boolean,close:()=>void,blocked=false){
  const latest=useRef({close,blocked});latest.current={close,blocked};
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    const dialog=document.querySelector<HTMLElement>('[role="dialog"]');if(!dialog)return;
    const focusable=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(e=>e.getClientRects().length>0);
    if(!dialog.contains(document.activeElement))focusable()[0]?.focus();
    function keydown(e:KeyboardEvent){
      if(e.key==='Escape'){e.preventDefault();if(!latest.current.blocked)latest.current.close()}
      if(e.key==='Tab'){const elements=focusable();const first=elements[0];const last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
    }
    document.addEventListener('keydown',keydown);
    return()=>{document.removeEventListener('keydown',keydown);previous?.focus()};
  },[open]);
}
