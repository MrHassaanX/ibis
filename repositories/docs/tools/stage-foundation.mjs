// Review all changes first. No commit, checkout, reset, network or push operations.
import path from 'node:path';
import { workspace, lock, git, entries } from './source-lib.mjs';

const check = process.argv.includes('--check');
for (const name of Object.keys(lock.repositories)) {
  const repo = path.join(workspace, name);
  const imported = lock.sources.filter(s => s.repository === name).flatMap(entries);
  if (!check) {
    git(repo, ['add', '-A']);
    if (imported.length) git(repo, ['update-index', '-z', '--index-info'], {
      input: imported.map(item => `${item.mode} ${item.oid}\t${item.relative}\0`).join(''),
    });
  }
  const index = new Map(git(repo, ['ls-files', '--stage', '-z']).toString().split('\0').filter(Boolean).map(line => {
    const tab = line.indexOf('\t');
    return [line.slice(tab + 1), line.slice(0, tab)];
  }));
  for (const item of imported) {
    if (index.get(item.relative) !== `${item.mode} ${item.oid} 0`) throw new Error(`Staged source differs: ${name}/${item.relative}`);
  }
  console.log(`${name}: ${imported.length} imported blob IDs and file modes match the index`);
}
