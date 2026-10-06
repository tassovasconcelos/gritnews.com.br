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

