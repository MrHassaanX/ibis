import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const workspace = path.resolve(docs, '..');
export const lock = JSON.parse(readFileSync(path.join(docs, 'upstream-lock.json'), 'utf8'));
export function git(repo, args, options = {}) {
  return execFileSync('git', ['-c', 'core.safecrlf=false', '-C', repo, ...args], { maxBuffer: 128 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], ...options });
}
export function entries(source) {
  const repo = path.join(workspace, source.repository);
  const commit = git(repo, ['rev-parse', `${source.commit}^{commit}`]).toString().trim();
  if (commit !== source.commit) throw new Error('Commit mismatch');
  const tree = git(repo, ['rev-parse', `${commit}^{tree}`]).toString().trim();
  if (tree !== source.tree) throw new Error('Tree mismatch');
  const seen = new Set();
  return git(repo, ['ls-tree', '-rz', '--full-tree', commit]).toString('utf8').split('\0').filter(Boolean).map(line => {
    const [header, name] = [line.slice(0, line.indexOf('\t')), line.slice(line.indexOf('\t') + 1)];
    const [mode, type, oid] = header.split(' ');
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) throw new Error(`Unsupported entry: ${name}`);
    const relative = source.renames?.[name] ?? (source.prefix ? `${source.prefix}/${name}` : name);
    if (relative.includes('\\') || relative.split('/').some(p => !p || p === '..' || p === '.' || p.toLowerCase() === '.git') || path.isAbsolute(relative)) throw new Error(`Unsafe path: ${relative}`);
    const key = relative.toLowerCase();
    if (seen.has(key)) throw new Error(`Case collision: ${relative}`);
    seen.add(key);
    const target = path.resolve(repo, relative);
    if (!target.startsWith(repo + path.sep)) throw new Error('Path outside repository');
    return { name, relative, target, mode, oid };
  });
}
export function blobs(repo, items) {
  const response = git(repo, ['cat-file', '--batch'], { input: items.map(e => e.oid).join('\n') + '\n' });
  let offset = 0;
  return items.map(item => {
    const end = response.indexOf(10, offset);
    const [oid, type, size] = response.subarray(offset, end).toString().split(' ');
    if (oid !== item.oid || type !== 'blob') throw new Error('Invalid object response');
    offset = end + 1;
    const data = response.subarray(offset, offset + Number(size));
    offset += Number(size) + 1;
    return data;
  });
}
