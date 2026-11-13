import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export const metadata: Metadata = { title: "Getting started" };
export default function Docs() {
  return (
    <main id="main" className="container document-page">
      <span className="eyebrow">THE FOUNDATION / DOCUMENTATION</span>
      <h1>
        Start with
        <br />
        <span className="gradient-text">solid ground.</span>
      </h1>
      <p className="lead">
        IbisPanel is in foundation development. Source integration is complete
        locally; an independently validated production release is still ahead.
      </p>
      <div className="doc-grid">
        <aside>
          <a href="#requirements">Requirements</a>
          <a href="#manual">Manual installation</a>
          <a href="#status">Project status</a>
          <a href="#contribute">Contribute</a>
        </aside>
        <div>
          <section id="requirements">
            <h2>Prepare a Linux environment</h2>
            <p>
              The imported Panel baseline is Pterodactyl v2.0.0-beta.2, paired
              with Wings v1.13.3. The inherited development requirements include
              PHP 8.3 or 8.4, Composer 2, Node.js 22.12+, MySQL/MariaDB, Redis,
              and a web server. Wings runs on Linux with Docker.
            </p>
            <p>
              Use a disposable environment to validate the exact pinned pair.
              Operating-system support and runtime compatibility have not yet
              been certified for an IbisPanel release.
            </p>
            <a
              className="text-link"
              href="https://docs.pterodactyl.io/v2/panel/requirements"
            >
              Upstream baseline requirements <ArrowUpRight size={14} />
            </a>
          </section>
          <section id="manual">
            <h2>Manual installation, by design</h2>
            <ol>
              <li>
                Review the source pins, runtime requirements and current
                validation limitations.
              </li>
              <li>
                Prepare isolated hosts, restricted database access and secure
                configuration.
              </li>
              <li>
                Build from reviewed source using its lockfiles and inherited
                workflow.
              </li>
              <li>
                For a fresh environment, configure the panel, then register a
                disposable Wings node.
              </li>
              <li>
                Verify permissions, files, workloads, schedules and backup
                restoration before considering a real deployment.
              </li>
            </ol>
            <p>
              Existing installations require verified backups, preserved
              encryption keys and a reviewed upgrade plan. No automated install
              command is published here because the IbisPanel installer is
              design-stage work.
            </p>
            <a
              className="text-link"
              href="https://github.com/IbisPanel/installer"
            >
              Installer and manual-workflow repository{" "}
              <ArrowUpRight size={14} />
            </a>
          </section>
          <section id="status">
            <h2>What exists. What comes next.</h2>
            <ul>
              <li>
                <strong>Foundation:</strong> inherited Panel, Wings and official
                Egg source collections, with licenses and provenance preserved.
              </li>
              <li>
                <strong>Website:</strong> interactive simulations, including an
                Ibis Studio design preview.
              </li>
              <li>
                <strong>Planned:</strong> guided installation, migration
                adapters, Studio integration and tailored universal workload
                workflows.
              </li>
            </ul>
            <p>
              The public repositories may not yet contain all local Phase 0
              documentation. Repository links intentionally point to their roots
              until that work is published.
            </p>
            <Link className="text-link" href="/demo">
              Explore the browser demo →
            </Link>
          </section>
          <section id="contribute">
            <h2>Help build the next chapter</h2>
            <p>
              Contribute documentation, compatibility research, reproducible
              issue reports or focused improvements. Preserve inherited
              attribution and separate new changes from upstream code.
            </p>
            <a className="text-link" href="https://github.com/IbisPanel/docs">
              Documentation repository <ArrowUpRight size={14} />
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
