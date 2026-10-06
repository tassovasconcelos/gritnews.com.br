import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const commit = process.env.GITHUB_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const body = JSON.stringify({release:'gritnews-admin-p0-20261006-v1',commit})+'\n';
for(const file of ['public/security-release.json','apps/gritnews/public/security-release.json']) writeFileSync(file,body);
