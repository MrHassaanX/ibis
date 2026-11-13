import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { docs, workspace, lock, git, entries } from './source-lib.mjs';

const report = { date: '2026-11-02', sources: [], repositories: [], errors: [], warnings: [] };
for (const source of lock.sources) {
  const repo = path.join(workspace, source.repository);
  const items = entries(source);
  const digest = createHash('sha256');
  for (const item of items) {
    try {
      if (lstatSync(item.target).isSymbolicLink()) throw new Error('Unexpected symbolic link');
      const data = readFileSync(item.target);
      const oid = createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
      if (oid !== item.oid) throw new Error('Git blob hash differs');
      digest.update(`${item.mode} ${item.oid}\t${item.relative}\n`);
    } catch (error) { report.errors.push(`${source.repository}/${item.relative}: ${error.message}`); }
  }
  report.sources.push({ repository: source.repository, prefix: source.prefix || '.', commit: source.commit, tree: source.tree, files: items.length, mappedManifestSha256: digest.digest('hex') });
}
for (const [name, info] of Object.entries(lock.repositories)) {
  const repo = path.join(workspace, name);
  try {
    git(repo, ['merge-base', '--is-ancestor', info.initialCommit, 'HEAD']);
    const original = git(repo, ['rev-parse', `${info.initialCommit}:LICENSE`]).toString().trim();
    const current = git(repo, ['hash-object', '--path=LICENSE', 'LICENSE']).toString().trim();
    if (original !== current) throw new Error('Initial license changed');
    git(repo, ['fsck', '--full', '--no-dangling']);
    report.repositories.push({ name, initialHistoryPreserved: true, initialLicenseUnchanged: true, objectIntegrity: 'passed' });
  } catch (error) { report.errors.push(`${name}: ${error.message}`); }
}
// Parse every imported JSON file without executing embedded Egg installation scripts.
let jsonFiles = 0;
for (const source of lock.sources) {
  for (const item of entries(source).filter(e => e.name.endsWith('.json'))) {
    try { JSON.parse(readFileSync(item.target, 'utf8')); jsonFiles++; }
    catch (error) {
      // Upstream uses JSONC for these tool configuration files.
      const jsonc = ['.oxlintrc.json', 'tsconfig.json', 'packages/sdk/docs-samples/tsconfig.json'];
      if (source.repository === 'panel' && jsonc.includes(item.name)) {
        report.warnings.push(`${source.repository}/${item.relative}: JSONC configuration; strict JSON parsing not applicable`);
      } else {
        report.errors.push(`${source.repository}/${item.relative}: upstream JSON syntax issue: ${error.message}`);
      }
    }
  }
}
report.jsonFilesParsed = jsonFiles;
report.runtimeTests = 'Not run: PHP, Composer, Go, Docker, MySQL/MariaDB and Redis unavailable; npm and node_modules absent. No dependency installation attempted.';
if (process.argv.includes('--write-report')) writeFileSync(path.join(docs, 'validation/source-integrity.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.errors.length ? 1 : 0;
