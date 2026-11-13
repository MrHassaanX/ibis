# Upstream baseline

- Source: https://github.com/pterodactyl/panel
- Release: https://github.com/pterodactyl/panel/releases/tag/v2.0.0-beta.2 (pre-release)
- Tag object: `dc72a0286f8e12883f60cc375c5b97b59d2617fe`
- Commit: `ea742d332f5861a81e502857446b8df9cb9f0254`
- Tree: `922428e2d550304374601b22e28cb694b6fc70a5`
- Original IbisPanel commit: `e208cdf282c53fd7aff4cd41ab9bad5667c603bf`
- Import: 2845 original blobs at their original paths, without application edits.
- License: original upstream `LICENSE.md` plus existing IbisPanel `LICENSE`.

Upstream history was fetched shallowly into local source refs; the IbisPanel branch retains its original ancestry and receives a source snapshot commit. No history overwrite or GitHub fork was used. All tracked files, including upstream workflows and dependency locks, are retained. Signature verification reported no signature on the tag; object integrity and reproducible byte equality are separate checks.

See the shared [lock and procedure](https://github.com/IbisPanel/docs/blob/main/upstream-provenance.md). From the sibling workspace, `node docs/tools/verify-source.mjs` compares every imported file against its original Git blob. It also reports any malformed inherited JSON asset in the companion Eggs repository.
