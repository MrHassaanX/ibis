# Upstream baseline

- Source: https://github.com/pterodactyl/wings
- Release: https://github.com/pterodactyl/wings/releases/tag/v1.13.3
- Lightweight tag commit: `6987d5e6f0612133e031255a99655e822d30579a`
- Tree: `b60b52531dda15b4bd3a3ce54d5ce08640687572`
- Original IbisPanel commit: `87317e13dbaf17fd1bf517866d3b3c9f4bd4d9e6`
- Import: 173 original blobs; `LICENSE` is mapped to `LICENSE.upstream` and all other paths are unchanged.

The imported MIT license is byte-identical to upstream, including the original 2018–2021 Dane Everitt and Contributors notice. The existing root MIT license remains unchanged. No inherited code is claimed as newly authored by IbisPanel.

Git object integrity and file bytes are verified against the locked snapshot. `verify-tag` cannot verify a lightweight tag. Commit signature trust remains unresolved because the environment has no SSH allowed-signers file. v1.13.4 was inspected but not selected; the explicit upstream 2.0 compatibility evidence names v1.13.3.

Reproduce and validate with the shared [provenance procedure](https://github.com/IbisPanel/docs/blob/main/upstream-provenance.md). Upstream source objects are local/shallow; they can be fetched again from the locked source when needed. Never reset IbisPanel's branch to upstream or force-push.
