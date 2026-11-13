# IbisPanel documentation

IbisPanel is independent, free, open-source hosting management software for hosting companies, developers, and self-hosters. It is not a hosting provider. The long-term scope includes game servers, websites, web applications, Discord bots, and other Docker workloads. Those broader workflows are future work, not Phase 0 features.

Phase 0 imports Pterodactyl source and documents the foundation. It does not deploy software, change its UI or identifiers, install dependencies, or implement installers or migration adapters.

| Repository | Responsibility | Phase 0 entry point |
| --- | --- | --- |
| [panel](https://github.com/IbisPanel/panel) | Web UI, API, authentication, permissions, orchestration | `IBISPANEL.md` |
| [wings](https://github.com/IbisPanel/wings) | Node daemon and Docker execution | `IBISPANEL.md` |
| [eggs](https://github.com/IbisPanel/eggs) | Existing workload definitions | `README.md` |
| [installer](https://github.com/IbisPanel/installer) | Planned lifecycle operations and manual installation | `ARCHITECTURE.md` |
| [migrator](https://github.com/IbisPanel/migrator) | Planned Migration Hub | `ARCHITECTURE.md` |
| [docs](https://github.com/IbisPanel/docs) | Shared architecture and evidence | This file |

Read [architecture](architecture.md), [upstream provenance](upstream-provenance.md), [development setup](development-setup.md), [compatibility](compatibility.md), [contributing](CONTRIBUTING.md), [security](SECURITY.md), [roadmap](roadmap.md), and the [Phase 0 report](phase-0-report.md).

Exact pins and initial repository commits are in [upstream-lock.json](upstream-lock.json). Reproducible local checks are in `tools/`; results are in `validation/`. The six repositories remain separate Git repositories, with their original histories. Nothing has been pushed.
