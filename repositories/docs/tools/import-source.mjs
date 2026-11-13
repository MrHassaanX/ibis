// Source snapshot import only. Does not install, migrate, commit, or push.
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { workspace, lock, git, entries, blobs } from './source-lib.mjs';

const plans = lock.sources.map(source => {
  const repo = path.join(workspace, source.repository);
  git(repo, ['merge-base', '--is-ancestor', lock.repositories[source.repository].initialCommit, 'HEAD']);
  const items = entries(source);
  const data = blobs(repo, items);
  items.forEach((item, i) => {
    for (let parent = path.dirname(item.target); parent !== repo; parent = path.dirname(parent)) {
      if (existsSync(parent) && lstatSync(parent).isSymbolicLink()) throw new Error(`Symlink parent: ${parent}`);
    }
    if (existsSync(item.target) && (lstatSync(item.target).isSymbolicLink() || !readFileSync(item.target).equals(data[i]))) {
      throw new Error(`Refusing to overwrite different existing file: ${item.relative}`);
    }
  });
  return { source, items, data };
});
// Preflight every source before creating any file; existing identical files are left intact.
for (const { source, items, data } of plans) {
  items.forEach((item, i) => {
    if (existsSync(item.target)) return;
    mkdirSync(path.dirname(item.target), { recursive: true });
    writeFileSync(item.target, data[i], { flag: 'wx' });
    if (process.platform !== 'win32') chmodSync(item.target, item.mode === '100755' ? 0o755 : 0o644);
  });
  console.log(`${source.repository}/${source.prefix || '.'}: ${items.length} files from ${source.commit}`);
}
