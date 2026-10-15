import { execFileSync } from 'node:child_process';
const manager = process.env.npm_execpath;
if (!manager) throw new Error('Run the build through npm or pnpm.');
const env = {...process.env};
// npm's inherited prefix can otherwise install the parent as a dependency.
for (const key of Object.keys(env)) if (/^npm_config_|^npm_package_/i.test(key)) delete env[key];
if (/[/\\]pnpm\.(?:cjs|js)$/i.test(manager)) {
  execFileSync(process.execPath,[manager,'--filter','meu-espetinho','build'],{stdio:'inherit',env});
} else {
  const cwd = new URL('../apps/meu-espetinho/',import.meta.url);
  execFileSync(process.execPath,[manager,'install','--no-audit','--no-fund'],{cwd,stdio:'inherit',env});
  execFileSync(process.execPath,[manager,'run','build'],{cwd,stdio:'inherit',env});
}


// GRIT Link União survey: copy the isolated static application into the
// deployed runtime so that the hostname router serves the right files.
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const surveyOut = resolve(projectRoot, 'dist', 'uniao');
mkdirSync(surveyOut, { recursive: true });
for (const page of ['index.html', 'acesso.html']) {
  cpSync(resolve(projectRoot, 'apps', 'link-uniao', page), resolve(surveyOut, page));
}
console.log('GRIT Link União survey assets copied to dist/uniao');
