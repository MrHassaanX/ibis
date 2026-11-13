# IbisPanel

IbisPanel is an independently maintained open-source panel for managing hosted servers. It uses a Pterodactyl 2.0 foundation and a compatible Wings daemon. The panel retains upstream architecture, API and storage contracts where changing them would break existing installations.

The administrator can configure the provider's company name, branding, appearance and server workloads. IbisPanel's default product name is **IbisPanel**; the configured provider name takes precedence where appropriate.

## Development

- Panel source: this repository.
- Local runtime: the existing Ubuntu WSL checkout described in the project setup notes.
- Start the local development services with `scripts/dev-up.sh` in WSL or `scripts/dev-up.ps1` on Windows.
- Run focused PHP tests, `npm run tsc`, `npm run lint`, and `npm run build` before committing changes.

Phase M's unfinished Minecraft Software Manager was intentionally withdrawn. See [PHASE-M-STATUS.md](PHASE-M-STATUS.md). The existing Minecraft Properties, Plugins and Mods features remain available.

## Upstream and license

IbisPanel derives from [Pterodactyl Panel](https://github.com/pterodactyl/panel). Original authorship and the MIT license are preserved in [LICENSE.md](LICENSE.md) and the source history. Pterodactyl's [Egg catalog](https://eggs.pterodactyl.io) and some integration identifiers remain upstream resources; their names do not imply IbisPanel authorship. Wings, Yolks and Eggs are not renamed by this panel branding work.
