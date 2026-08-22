import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export type ConnectionState = {
  connected: boolean;
  connectionType: string;
  native: boolean;
  platform: string;
};

export function isNativeApp(){
  return Capacitor.isNativePlatform();
}

export function mobilePlatform(){
  return Capacitor.getPlatform();
}

export async function getConnectionState():Promise<ConnectionState>{
  if(!Capacitor.isNativePlatform()){
    return {
      connected: typeof navigator==='undefined' ? true : navigator.onLine,
      connectionType: typeof navigator==='undefined' || navigator.onLine ? 'web' : 'none',
      native: false,
      platform: 'web',
    };
  }
  const status=await Network.getStatus();
  return {
    connected: status.connected,
    connectionType: status.connectionType,
    native: true,
    platform: Capacitor.getPlatform(),
  };
}

export async function watchConnection(onChange:(state:ConnectionState)=>void){
  if(!Capacitor.isNativePlatform()){
    const emit=()=>onChange({connected:navigator.onLine,connectionType:navigator.onLine?'web':'none',native:false,platform:'web'});
    window.addEventListener('online',emit);
    window.addEventListener('offline',emit);
    emit();
    return ()=>{
      window.removeEventListener('online',emit);
      window.removeEventListener('offline',emit);
    };
  }
  const handle=await Network.addListener('networkStatusChange',status=>onChange({connected:status.connected,connectionType:status.connectionType,native:true,platform:Capacitor.getPlatform()}));
  onChange(await getConnectionState());
  return ()=>handle.remove();
}
