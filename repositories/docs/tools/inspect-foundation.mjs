import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { docs, workspace, lock, entries } from './source-lib.mjs';

const json = relative => JSON.parse(readFileSync(path.join(workspace, relative), 'utf8'));
const composer = json('panel/composer.json');
const composerLock = json('panel/composer.lock');
const pkg = json('panel/package.json');
const npmLock = json('panel/package-lock.json');
const errors = [];
for (const field of ['dependencies', 'devDependencies', 'engines']) {
  const canonical = value => JSON.stringify(Object.entries(value || {}).sort(([a], [b]) => a.localeCompare(b)));
  if (canonical(pkg[field]) !== canonical(npmLock.packages[''][field])) errors.push(`npm manifest/lock root mismatch: ${field}`);
}
const eggs = [];
for (const source of lock.sources.filter(s => s.repository === 'eggs')) {
  const summary = { collection: source.prefix, eggs: 0, formats: {}, unsupportedFormats: [] };
  for (const entry of entries(source).filter(e => /^egg-.*\.json$/i.test(path.basename(e.name)))) {
    const value = JSON.parse(readFileSync(entry.target, 'utf8'));
    const version = value.meta?.version || '(missing)';
    summary.eggs++;
    summary.formats[version] = (summary.formats[version] || 0) + 1;
    if (!['PTDL_v1', 'PTDL_v2'].includes(version)) summary.unsupportedFormats.push(entry.relative);
  }
  if (summary.unsupportedFormats.length) errors.push(`${source.prefix}: unsupported Egg formats`);
  eggs.push(summary);
}
const inventory = {
  date: '2026-11-02',
  scope: 'Lockfile metadata only. Does not verify downloaded dependencies, their license files, vulnerabilities or runtime compatibility.',
  composer: [...composerLock.packages, ...composerLock['packages-dev']].map(p => ({ name: p.name, version: p.version, license: p.license || [] })),
  npm: Object.entries(npmLock.packages).filter(([name]) => name).map(([name, p]) => ({ path: name, version: p.version || null, license: p.license || null, integrityRecorded: Boolean(p.integrity), link: Boolean(p.link) })),
  go: { module: 'github.com/pterodactyl/wings', licenseInventory: 'Not resolved without Go module downloads; preserve go.mod/go.sum and inspect dependency licenses before distribution.' },
};
const summary = {
  date: '2026-11-02',
  panel: { php: composer.require.php, platformPhp: composer.config.platform.php, laravel: composer.require['laravel/framework'], node: pkg.engines.node, npmLockVersion: npmLock.lockfileVersion, composerLockedPackages: inventory.composer.length, npmLockedPackages: inventory.npm.length },
  wings: { go: '1.24.0', toolchain: 'go1.24.1', validation: 'go.mod inspected; dependency resolution/build not run' },
  eggs,
  errors,
  limits: 'Static format and lockfile metadata checks only. Actual Panel Egg validation and workload installation have not run.',
};
if (process.argv.includes('--write-report')) {
  writeFileSync(path.join(docs, 'validation/foundation-checks.json'), JSON.stringify(summary, null, 2) + '\n');
  writeFileSync(path.join(docs, 'validation/dependency-inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
}
console.log(JSON.stringify(summary, null, 2));
process.exitCode = errors.length ? 1 : 0;
