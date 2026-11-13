# IbisPanel Phase 0 report

Date: 2026-11-02. Phase 0 source integration and documentation are complete locally, with the validation limitations below. No production deployment, remote push, installer implementation, live migration, custom Egg, UI redesign or daemon modification was performed.

## Repository summary and changes

| Repository | Result | IbisPanel files added |
| --- | --- | --- |
| Panel | 2845 unmodified upstream blobs, `v2.0.0-beta.2` | `IBISPANEL.md`, `UPSTREAM.md`, `NOTICE` |
| Wings | 173 unmodified upstream blobs, `v1.13.3`; license path mapped | `IBISPANEL.md`, `UPSTREAM.md`, `NOTICE` |
| Eggs | 750 unmodified upstream blobs across three official subtrees; 321 Egg definitions | `README.md`, `UPSTREAM.md`, `NOTICE` |
| Installer | Six-operation architecture and manual workflow; design only | `README.md`, `ARCHITECTURE.md`, `MANUAL-INSTALLATION.md`, `CONTRIBUTING.md` |
| Migrator | Modular Migration Hub, four source families, dry-run/reporting/recovery design | `README.md`, `ARCHITECTURE.md`, `COMPATIBILITY.md`, `RECOVERY.md`, `CONTRIBUTING.md` |
| Docs | Architecture, attribution, developer setup, compatibility, roadmap, contribution/security guidance and machine-readable evidence | Root Markdown docs, `upstream-lock.json`, five `tools/*.mjs` helpers, `validation/*.json`, this report |

All six repositories were cloned from their existing public IbisPanel origins and inspected before changes. Each initially tracked only its MIT `LICENSE`. Existing source files were not replaced: Wings' conflicting upstream license was retained as `LICENSE.upstream`; Eggs use collection prefixes. The Panel `LICENSE.md` has no collision with the existing `LICENSE`. Imported `.env.example` and `.env.ci` remain upstream templates/fixtures; no live secret environment was created.

## Exact upstream commits

| Source | Version/reference | Commit |
| --- | --- | --- |
| Panel | `v2.0.0-beta.2` | `ea742d332f5861a81e502857446b8df9cb9f0254` |
| Wings | `v1.13.3` | `6987d5e6f0612133e031255a99655e822d30579a` |
| Game Eggs | Snapshot | `be654a201bf3b90446569167d4864edec1b33009` |
| Application Eggs | Snapshot | `122086603fce7b6582ad8cce7982c4367e2ea572` |
| Generic Eggs | Snapshot | `6e8d2546e493937ede885a17d64b7c4a368cacec` |

`upstream-lock.json` also records tree IDs, the Panel tag object and all six original repository commits. The originally requested Eggs URL returns 404; the former community organization identifies the three official replacements. Wings 1.13.4 was examined, but 1.13.3 was selected because [upstream explicitly lists it as tested with Panel 2.0](https://docs.pterodactyl.io/v2/panel/requirements).

## License and authorship status

All initial IbisPanel MIT licenses remain unchanged according to Git's original checkout filters. Original Pterodactyl/individual copyright, MIT terms, authorship fields and bundled notices remain intact. Imported application code is attributed to upstream; IbisPanel additions are integration/documentation work. `NOTICE` and `UPSTREAM.md` distinguish them. Dependency lock metadata inventory is recorded for 167 Composer packages and 540 npm entries; this is not a complete downloaded license audit. Go dependencies were not downloaded. No other panel's implementation code was imported.

## Validation actually performed

| Check | Result and evidence |
| --- | --- |
| Source byte integrity | All 3768 imported blobs match their locked original Git blob IDs; five source manifest SHA-256 digests recorded in `validation/source-integrity.json` |
| Git object integrity | `git fsck --full --no-dangling` passed for all six repositories |
| Original ancestry/licenses | Original commit remains an ancestor in all six repositories; original root license blob matches after checkout normalization |
| Import repetition | Import helper re-run leaves identical source in place and refuses conflicting destinations; final result recorded in completion evidence |
| Staged paths/modes | Imported source blobs and executable modes checked against Git index using `stage-foundation.mjs --check` |
| Egg metadata | 254 game, 55 application and 12 generic definitions parsed; all 321 declare PTDL_v2. Actual Panel schema/import/runtime validation remains unrun |
| Dependency metadata | Direct npm dependency specs agree with the lock root; engine metadata check fails (`>=22.12` versus `>=22`) |
| JSON parsing | 523 imported JSON documents parsed; three JSONC tool configs are explicitly excluded from strict JSON interpretation; Sunkenland auxiliary world file fails parsing at line 258 |
| Source helper syntax | Node syntax checks for the five new standard-library-only `.mjs` helpers recorded in completion evidence |
| Whitespace | Full source-import checks flag inherited whitespace in Panel, Wings and Eggs; summarized in `validation/whitespace-checks.json`. IbisPanel-authored additions are checked separately |
| Signature verification | Panel tag has no signature; Wings tag is lightweight and its SSH commit signature cannot be trusted locally without allowed-signers configuration |
| Runtime/build/lint/tests | Not run: PHP, Composer, Go, Docker and npm unavailable; no dependency trees or DB/Redis services provisioned. No dependencies installed to work around this |

`verify-source.mjs` exits nonzero because of the inherited Sunkenland JSON issue, while every blob comparison and repository integrity check passes. `inspect-foundation.mjs` exits nonzero because of the inherited engine metadata mismatch. These are real reported findings, not corrected or hidden to obtain a green result. No application unit/integration tests, frontend build, Composer resolution/platform check, Go build/test/vet, vulnerability audit or end-to-end test is claimed as passed.

## Local commits and scope

Each repository receives a focused local Phase 0 commit descended from its initial commit, with an explicit automation author rather than impersonating the existing repository author. Imported code is identified in the commit message as original upstream work. Exact local SHAs for the first five repositories and validation state are recorded in `validation/completion.json`; the docs commit is discoverable with `git -C docs log -1`. No commits were pushed. Local fetched upstream refs remain separate from IbisPanel's branch ancestry.

## Risks and next order

This remains an upstream beta baseline. Runtime compatibility, dependency resolution, signature trust and complete dependency license/security review remain open. Workload scripts and images may drift or disappear despite immutable source. Legacy add-ons and alternate panel schemas/agents are not certified. Inherited external URLs, telemetry and publishing workflows remain unchanged and need review before an independent release or any later push. All migration research is a design input, not implemented support.

Phase 1 should start with Linux runtime/CI and protocol regression validation, then independent release/configuration identity, then extension/theme contracts and broader workload design. Installer execution and narrowly versioned read-only migration discovery follow those foundations; daemon enhancements come after regression coverage. See `roadmap.md` for the full sequence. Stop here before Phase 1 implementation.
