# IbisPanel source backup manifest

Backup date: 2026-11-13. Source: clean Git HEADs in `/srv/ibispanel/` on the existing Ubuntu 24.04 Sydney EC2 development instance. This is a source snapshot, not a deployment or complete Git-history backup.

| Repository | AWS HEAD | Branch | Exported files |
| --- | --- | --- | ---: |
| `panel` | `32edb8d46ab481c2513fcab6599e64d6b706b714` | `main` | 2981 |
| `wings` | `1c37ddbedebb0fe6af95c2b46e85d099847e58bd` | `main` | 177 |
| `eggs` | `7e3629bdd716cd613d6a58b47636b2534d0f61c7` | `main` | 768 |
| `website` | `b480b402ebd95105fc4291ba4de441726b6475e3` | `main` | 47 |
| `docs` | `222c00516bd3f1abccd2c02147a4de93aa6d8f15` | `main` | 21 |
| `installer` | `61649550bd87de7fc326d9f763c745941f08710a` | `main` | 5 |
| `migrator` | `7ffb54cbb957ffd1003fd2bfd054ba47844f6e2e` | `main` | 6 |

`yolks` was not present and is not included. Each directory was exported using `git archive HEAD`; untracked files, `.git` histories, runtime files, and dependencies are absent. The tracked `.env.ci` fixture was also excluded from this public snapshot. The retained repository license and upstream attribution files remain part of their source trees.

## Technology and environment

Panel: Laravel/PHP, React/TypeScript, MariaDB, Redis and Nginx. Wings: Go and Docker Engine. Eggs: JSON definitions, Dockerfiles and scripts. Website: source assets and build manifests. The development panel is at `https://demo.ibispanel.online`; Wings is at `https://node.ibispanel.online:8080`. These endpoints and their live configuration are not required to inspect the source snapshot.

## Scope at backup time

The Panel source includes the existing IbisPanel appearance, region, announcement, Minecraft management, Git import and workload UI work. The latest source change adds a built-in `nodejs` Egg tag. The Eggs source includes the maintained Generic Node.js Egg and the tagged Web Egg. The Generic Egg was exercised with JavaScript, erasable TypeScript, npm install-mode checks, a public Git clone, HTTP startup, and graceful STOP on disposable server ID 5; that server was left stopped. These checks do not constitute verification of every workload or a production deployment.

Remaining work includes broader workload compatibility, a full private runtime recovery backup, and future features intentionally outside this source-backup checkpoint. See per-repository documentation and tests for current implementation details.

## Exclusions

No live `.env`, administrator password, API or node token, private key, TLS material, database dump, server volume, customer data, runtime log, `node_modules`, `vendor`, generated build cache or original `.git` history is included. Save private runtime data and any full-history bundles only to an approved encrypted private destination.
