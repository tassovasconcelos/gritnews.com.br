export async function withOperationDeadline<T>(task:PromiseLike<T>,ms=15000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([Promise.resolve(task),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('operation_timeout')),ms);})]);}
 finally{clearTimeout(timer);}
}
