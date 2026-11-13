# IbisPanel installer architecture

Phase 0 contains design documentation only. There is no executable installer, updater, repair tool or migration script. Manual installation remains a first-class workflow.

Read [operation architecture](ARCHITECTURE.md), [manual installation runbook](MANUAL-INSTALLATION.md), and [contributing](CONTRIBUTING.md). The initial MIT `LICENSE` and repository history are preserved. No third-party installer code was imported.

The future installer must support: Panel only, Wings only, Panel plus Wings, update, migration coordination, and diagnosis/repair. It must use pinned IbisPanel artifacts, require explicit plans for mutations, preserve installation secrets/data and produce redacted reports. Source baselines and development prerequisites are maintained in the [shared docs](https://github.com/IbisPanel/docs).
