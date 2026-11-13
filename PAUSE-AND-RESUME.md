# Pause and resume IbisPanel development

This source-only snapshot was exported on 2026-11-13 from the AWS source of truth. Read `BACKUP-MANIFEST.md` before restoring. Do not overwrite a newer AWS tree with this snapshot.

1. Keep the existing EC2 instance and private runtime data intact until an independently verified encrypted off-instance backup exists. This public repository contains no database, server volume, administrator credentials, node tokens or original Git histories.
2. To inspect or resume source work on a new machine, copy the needed `repositories/<name>` directories into separate working directories, inspect their README/license files, install each project's dependencies from its lockfiles, and initialize new Git repositories or restore separately saved private Git bundles. Use the manifest SHAs to identify the exact upstream commits represented here.
3. To restore a running environment, provision Ubuntu, PHP/Laravel dependencies, MariaDB, Redis, Nginx, Go/Wings and Docker according to each project's docs. Provide new private configuration and secrets securely. Restore database and server volumes only from a verified private backup, then run the project's normal migrations and checks. Configure DNS/TLS and Wings node enrollment for the target environment. Do not reuse development credentials in production.
4. Before changing the existing AWS development machine, verify its current Git HEADs and service/data state against the manifest. Keep disposable server ID 5 stopped unless testing is deliberately resumed. Do not accept Minecraft EULAs or process old queued jobs as part of restoration.

Validated Node.js source commits at this checkpoint: Panel `32edb8d46ab481c2513fcab6599e64d6b706b714` and Eggs `7e3629bdd716cd613d6a58b47636b2534d0f61c7`. The Generic Egg is ID 16 and the Web Egg is ID 15 on the current AWS database; these numeric IDs are runtime state and will differ after a fresh database installation.
