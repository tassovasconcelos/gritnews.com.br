import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Writable} from 'node:stream';
import {pathToFileURL} from 'node:url';
import {validatePackage} from '../release-check.mjs';

export function validateTarget(user,directory){
 const dedicated=/^[a-zA-Z0-9_-]+\.cip\.gritnews\.com\.br$/.test(user||'');
 const root=directory==='public_html/'||directory==='/public_html/';
 const subdirectories=['public_html/cip/','/public_html/cip/','domains/gritnews.com.br/public_html/cip/','/domains/gritnews.com.br/public_html/cip/'];
 assert.ok((root&&dedicated)||subdirectories.includes(directory),'Refusing target outside an isolated CIP directory');
 return '/'+directory.replace(/^\//,'').replace(/\/$/,'');
}

export async function publish(directory,commit){
 const manifest=validatePackage(directory,commit,true);
 const {CIP_FTPS_HOST:host,CIP_FTPS_USER:user,CIP_FTPS_PASSWORD:password,CIP_FTPS_DIR:remote}=process.env;
 assert.ok(host&&user&&password&&remote,'Missing FTPS configuration');
 const expected=validateTarget(user,remote);
 const {Client}=await import('basic-ftp');
 const client=new Client(30000);
 // Hostinger's inspected FTPS certificate covers hstgr.io. Keep both chain
 // and name validation enabled while connecting to the hPanel origin IP.
 const secureOptions={host:'hstgr.io',servername:'hstgr.io',rejectUnauthorized:true,minVersion:'TLSv1.2'};
 const files=[...Object.keys(manifest.files).filter(name=>name!=='index.html'),'index.html','release-manifest.json'];
 try{
  await client.access({host,user,password,port:21,secure:true,secureOptions});
  await client.cd(remote);
  assert.equal((await client.pwd()).replace(/\/$/,''),expected,'Remote working directory does not match the isolated target');
  for(const file of files){
   const staging=`.cip-stage-${commit.slice(0,12)}-${file}`;
   await client.uploadFrom(path.join(directory,file),staging);
   const chunks=[];
   const sink=new Writable({write(chunk,_encoding,done){chunks.push(chunk);done();}});
   await client.downloadTo(sink,staging);
   assert.ok(Buffer.concat(chunks).equals(fs.readFileSync(path.join(directory,file))),`Staged bytes differ: ${file}`);
   console.log(`Staged and verified: ${file}`);
  }
  // Publish the entry page and manifest last. No directory cleanup or deletes.
  for(const file of files)await client.rename(`.cip-stage-${commit.slice(0,12)}-${file}`,file);
  console.log('Isolated CIP files published; HTTPS byte comparison follows.');
 }finally{client.close();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
 publish(process.argv[2],process.argv[3]).catch(error=>{
  // Never serialize a transport error: it may contain credentials or paths.
  const code=String(error.code||'TRANSFER_FAILED').replace(/[^A-Z0-9_]/gi,'');
  console.error(`::error::CIP FTPS publication failed (${code}); no directory cleanup was performed.`);
  process.exitCode=1;
 });
}
