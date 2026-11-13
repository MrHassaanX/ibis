# Upstream provenance and import procedure

Recorded on 2026-11-02. All six public IbisPanel repositories initially contained only their MIT `LICENSE`. Their original commits are pinned in `upstream-lock.json`; every new commit descends from those commits. Original license files were read before import and remain unchanged under Git's checkout line-ending rules.

## Source pins

| Source | Reference | Exact commit | Imported files |
| --- | --- | --- | ---: |
| `pterodactyl/panel` | `v2.0.0-beta.2` | `ea742d332f5861a81e502857446b8df9cb9f0254` | 2845 |
| `pterodactyl/wings` | `v1.13.3` | `6987d5e6f0612133e031255a99655e822d30579a` | 173 |
| `pterodactyl/game-eggs` | Pinned HEAD snapshot | `be654a201bf3b90446569167d4864edec1b33009` | 588 |
| `pterodactyl/application-eggs` | Pinned HEAD snapshot | `122086603fce7b6582ad8cce7982c4367e2ea572` | 126 |
| `pterodactyl/generic-eggs` | Pinned HEAD snapshot | `6e8d2546e493937ede885a17d64b7c4a368cacec` | 36 |

Panel's annotated tag object is `dc72a0286f8e12883f60cc375c5b97b59d2617fe`; its peeled commit is the SHA above. It is an open beta, not a stable IbisPanel release. Wings v1.13.4 was inspected, but v1.13.3 was selected because the official [Panel 2.0 requirements](https://docs.pterodactyl.io/v2/panel/requirements) explicitly describe testing with v1.13.2 and v1.13.3. No local runtime compatibility test has run.

The supplied `https://github.com/pterodactyl/eggs` returns 404. The [former community organization's notice](https://github.com/Ptero-Eggs) identifies the three replacement repositories. Import all three under matching directory prefixes. No custom Eggs were added. These snapshots do not have a shared release number or a guarantee that every workload still installs.

## Authorship and licenses

The imported code is Pterodactyl and community authors' work, not newly written IbisPanel code. Panel's `LICENSE.md` retains Dane Everitt and contributors' notice. Wings' original `LICENSE` is copied byte-for-byte to `LICENSE.upstream` to avoid replacing the existing IbisPanel `LICENSE`; it retains Dane Everitt and Contributors' 2018–2021 notice. Each Eggs subtree retains its own `LICENSE`, embedded author fields, scripts, README files, and notices. Game/application Eggs credit the Pterodactyl team and contributors (2024); generic Eggs credit Michael Parker and Contributors (2018).

Existing IbisPanel root licenses cover IbisPanel additions. They do not replace inherited notices. Include both when distributing substantial inherited source or binaries. Third-party dependencies retain their own terms; lockfile license metadata is an inventory aid, not a substitute for packaged license files. No Pelican, Reviactyl, or PufferPanel implementation code was imported. Their research informs migration design only.

## Reproduce from clean sibling clones

Use Git and Node >=22.12. Clone the six existing IbisPanel repositories as siblings under a new dedicated workspace. For Windows clones of the completed source, use `git clone --config core.autocrlf=false URL DIRECTORY` so byte-level validation is not obscured by CRLF checkout conversion. Existing initial-license-only clones can also be used: the importer leaves their initial licenses untouched. Obtain this docs commit, and compare the original commits against `upstream-lock.json`. Fetch each official source into the repository named by its lock entry. For Panel, for example:

```sh
git -C panel fetch --depth=1 --no-tags https://github.com/pterodactyl/panel.git refs/tags/v2.0.0-beta.2:refs/tags/upstream/v2.0.0-beta.2
git -C panel rev-parse 'upstream/v2.0.0-beta.2^{commit}'
git -C panel rev-parse 'upstream/v2.0.0-beta.2^{tree}'
```

For Wings fetch `refs/tags/v1.13.3` from its URL. For each Eggs entry fetch the exact locked commit from its source URL into `eggs` (not today's moving HEAD). Compare all commit and tree IDs against the lock. If a server no longer serves an unreachable SHA, obtain an authenticated upstream Git bundle from a maintainer and verify the same IDs; never silently repin.

```sh
node docs/tools/import-source.mjs
node docs/tools/verify-source.mjs
node docs/tools/inspect-foundation.mjs
```

The importer uses Git object bytes, preflights every destination, rejects symlinks/submodules/path traversal and case collisions, and refuses to overwrite different files. Existing identical files are left intact. It runs no imported script and makes no commits. A conflict requires manual inspection. It does not offer a destructive update mode. Export every tracked blob, including files that an archive's export-ignore rules might omit.

Review the result, then stage with `node docs/tools/stage-foundation.mjs` to preserve executable Git modes on Windows. The helper stages each repository's reviewed files and restores exact imported blob IDs/modes; it does not commit or push. Do not run it with unrelated work present. Verify staged modes using its `--check` option. Keep the resulting source import commit separate from later behavior changes.

For future security work, fetch old and new upstream commits and inspect `git diff OLD NEW`. Apply reviewed patches to the independent IbisPanel branch, retain all local commits, and validate regressions. The source tool is for baseline reproduction, not a replacement updater.

## Integrity and signature limits

Git object checks, SHA/tree comparisons, and per-file blob hashes establish reproducibility against the fetched official HTTPS source. `git fsck --full --no-dangling` checks object integrity. These do not establish a trusted signer or a vulnerability-free source tree. Panel `git verify-tag` reported no signature. Wings v1.13.3 is a lightweight tag; `verify-tag` cannot verify it. `verify-commit` could not establish trust because this machine has no SSH allowed-signers file. These checks are recorded as unresolved, not successful signature verification.

Fetched histories are shallow to avoid unnecessary downloads. Retain the lock and IbisPanel provenance commits after publication; local upstream refs and objects are not automatically transferred by pushing the IbisPanel branch. Re-fetch pins when reproducing. Source manifests include paths, modes and original Git blob IDs in a SHA-256 digest; license contents are also retained in the actual source trees.
