# IbisPanel Eggs foundation

This repository preserves existing official Pterodactyl workload definitions, with each source collection in its own subtree. No new Eggs or installation scripts were written in Phase 0.

| Directory | Contents | License |
| --- | --- | --- |
| `game-eggs` | Existing games and related files | `game-eggs/LICENSE` |
| `application-eggs` | Existing applications, bots, databases and tools | `application-eggs/LICENSE` |
| `generic-eggs` | Existing language/runtime workloads | `generic-eggs/LICENSE` |

The supplied `pterodactyl/eggs` URL is unavailable. The [community migration notice](https://github.com/Ptero-Eggs) identifies these replacement official sources. Exact commits are in `UPSTREAM.md`; original authors, readmes, scripts, images, metadata, licenses and auxiliary files are retained. The root `LICENSE` remains IbisPanel's initial MIT license and does not replace subtree licenses.

Panel's imported validator supports PTDL_v1 and PTDL_v2. Run the shared static checks with `node docs/tools/inspect-foundation.mjs`, then test selected definitions through the actual Panel and disposable containers before use. Do not automatically execute every included Egg. JSON syntax checks do not prove image availability, safe scripts or successful workload installation.

Known inherited issue: `game-eggs/sunkenland/world_files/Worlds/World~11223344-5566-7788-99aa-bbccddeeff00/world.json` fails strict JSON parsing at line 258. Its original bytes are preserved; a future correction should be a separate reviewed change. It is an auxiliary sample, not an `egg-*.json` definition.

Future website, app and bot Eggs require explicit capabilities, reviewed install/update behavior, secret handling, architecture/image support and retained licensing. New definitions are outside Phase 0. See shared [compatibility](https://github.com/IbisPanel/docs/blob/main/compatibility.md) and contribution guidance.
