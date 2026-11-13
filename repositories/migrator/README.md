# IbisPanel Migration Hub design

Phase 0 defines a modular migration design for Pterodactyl, Reviactyl, Pelican Panel and PufferPanel. No adapters, transfer commands, live migrations or placeholder implementations are included.

Read [architecture](ARCHITECTURE.md), [researched compatibility differences](COMPATIBILITY.md), [recovery and validation](RECOVERY.md), and [contributing](CONTRIBUTING.md). The initial MIT `LICENSE` and history remain unchanged. No implementation code from another panel was imported.

Migration support is a future goal, not a compatibility claim. Every eventual adapter must declare tested source versions, discovery methods, data mappings, exclusions and recovery guarantees. Unknown schemas and plugins must fail discovery safely rather than being assumed to match Pterodactyl.
