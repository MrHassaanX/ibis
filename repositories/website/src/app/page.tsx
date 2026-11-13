import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Braces,
  Check,
  Cpu,
  Fingerprint,
  GitFork,
  Globe2,
  Layers3,
  LockKeyhole,
  Terminal,
  Workflow,
} from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { Studio } from "@/components/Studio";
import { PageMotion } from "@/components/PageMotion";
import { Ecosystem } from "@/components/Ecosystem";
import { Brand } from "@/components/Brand";
import { faq, github, repositories } from "@/lib/content";
export default function Home() {
  return (
    <main id="main">
      <PageMotion />
      <section className="hero container">
        <div className="hero-orbit" aria-hidden="true" />
        <div className="hero-copy">
          <div className="release-pill">
            <span className="signal" /> INDEPENDENT BY DESIGN{" "}
            <span>OPEN SOURCE ↗</span>
          </div>
          <h1>
            One panel.
            <br />
            <em>Every workload.</em>
          </h1>
          <p className="hero-description">
            Your worlds. Your applications. Your infrastructure.
            <br className="desktop-break" /> An open-source control panel built
            around <strong>you.</strong>
          </p>
          <div className="hero-actions">
            <Link href="/demo" className="button primary">
              Explore the demo <ArrowUpRight size={18} />
            </Link>
            <a href="#installation" className="button secondary">
              Get started <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-footnote">
            <span>
              <Check size={13} /> Free & open source
            </span>
            <span>
              <Check size={13} /> Self-hosted
            </span>
            <span>
              <Check size={13} /> Yours to build on
            </span>
          </div>
        </div>
        <div className="hero-product">
          <div className="hero-product-label">
            <span>YOUR NEXT CONTROL ROOM</span>
            <span>01 / PRODUCT PREVIEW</span>
          </div>
          <Dashboard compact />
          <div className="hero-product-caption">
            <span>
              <i className="signal" /> Real interactions. Simulated
              infrastructure.
            </span>
            <a href="#showcase">
              Take a closer look <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>
      <div className="container foundation-strip">
        <span>
          ONE FOUNDATION.
          <br />
          <b>MORE POSSIBILITIES.</b>
        </span>
        <div>
          <Box />
          Game servers
        </div>
        <div>
          <Globe2 />
          Websites
        </div>
        <div>
          <Braces />
          Applications
        </div>
        <div>
          <Terminal />
          Discord bots
        </div>
        <small>
          Workload experiences
          <br />
          shown as previews
        </small>
      </div>
      <section id="features" className="container section architecture">
        <div className="section-heading">
          <span className="eyebrow">01 / BUILT FOR OWNERSHIP</span>
          <h2>
            Power underneath.
            <br />
            <span>Clarity on the surface.</span>
          </h2>
          <p>
            The tools to manage your infrastructure, with the freedom to
            understand it. Built on the Pterodactyl foundation. Moving forward
            in the open.
          </p>
        </div>
        <div className="architecture-layout">
          <div className="architecture-map">
            <div className="arch-label">THE CONTROL PLANE</div>
            <div className="arch-panel">
              <Brand />
              <span>Identities · permissions · orchestration</span>
            </div>
            <div className="connector">
              <span>Authenticated API</span>
            </div>
            <div className="wing-node">
              <Workflow size={22} />
              <div>
                <strong>Wings</strong>
                <span>Your node. Your execution layer.</span>
              </div>
              <span className="status">
                <i />
                Foundation
              </span>
            </div>
            <div className="node-lines" />
            <div className="containers">
              {["Game", "Web", "App", "Bot"].map((x) => (
                <div key={x}>
                  <Box size={19} />
                  <span>{x}</span>
                </div>
              ))}
            </div>
            <p className="small muted">
              Illustrative architecture · Docker-based workloads
            </p>
          </div>
          <div className="feature-list">
            {[
              [
                Layers3,
                "A place for every process",
                "Containerized workloads, reusable Eggs and resource visibility provide the foundation.",
              ],
              [
                Fingerprint,
                "The right access. Nothing more.",
                "Inherited authentication, user permissions and server management keep control in your hands.",
              ],
              [
                Cpu,
                "Know what is happening",
                "Console access, resource monitoring, files, schedules and backups belong in one workflow.",
              ],
              [
                GitFork,
                "Open by nature",
                "Read the code. Shape the roadmap. Extend the existing architecture with the community.",
              ],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Layers3;
              return (
                <div key={String(title)}>
                  <I size={22} />
                  <div>
                    <h3>{String(title)}</h3>
                    <p>{String(text)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section id="showcase" className="showcase-section section">
        <div className="container">
          <div className="section-heading heading-split">
            <div>
              <span className="eyebrow">02 / A CLOSER LOOK</span>
              <h2>
                Less switching.
                <br />
                <span>More doing.</span>
              </h2>
            </div>
            <div>
              <p>
                From the first console line to the next backup. Explore a
                workspace that puts the whole picture within reach.
              </p>
              <Link className="text-link" href="/demo">
                Open the full preview <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="showcase-frame">
            <Dashboard initialView="Overview" />
          </div>
          <p className="preview-disclosure">
            <LockKeyhole size={13} /> Everything here is simulated. No commands
            are executed and no servers are connected.
          </p>
        </div>
      </section>
      <section id="studio" className="container section studio-section">
        <div className="section-heading heading-split">
          <div>
            <span className="eyebrow">
              03 / IBIS STUDIO <span className="pill">PLANNED</span>
            </span>
            <h2>
              Your panel.
              <br />
              <span className="gradient-text">Your point of view.</span>
            </h2>
          </div>
          <div>
            <p>
              A quieter palette. A tighter layout. A little more room to
              breathe. Tune the preview until it feels like home.
            </p>
            <span className="small muted">
              Interactive concept · planned panel capabilities
            </span>
          </div>
        </div>
        <Studio />
        <div className="studio-endnote">
          <span>NO ACCOUNT. NO SETUP. JUST EXPLORE.</span>
          <span>Changes stay in this preview.</span>
        </div>
      </section>
      <section id="eggs" className="container section">
        <div className="section-heading">
          <span className="eyebrow">04 / ROOM TO GROW</span>
          <h2>
            A foundation.
            <br />
            <span>Not a ceiling.</span>
          </h2>
          <p>
            Start with existing Eggs. Imagine your own extensions. Help shape an
            ecosystem built for the people who use it.
          </p>
        </div>
        <Ecosystem />
      </section>
      <section id="migration" className="container section migration-section">
        <div className="migration-intro">
          <span className="eyebrow">
            05 / A PATH FORWARD <span className="pill">PLANNED</span>
          </span>
          <h2>
            A new chapter.
            <br />
            <span>Not a fresh start.</span>
          </h2>
          <p>
            The Migration Hub is being designed to help bring compatible
            workloads and data with you. Every source needs its own verified
            adapter.
          </p>
          <a className="text-link" href={`${github}/migrator`}>
            Follow the Migration Hub <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="migration-visual">
          <div className="migration-sources">
            {["Pterodactyl", "Reviactyl", "Pelican", "PufferPanel"].map((x) => (
              <span key={x}>
                {x}
                <ArrowRight size={14} />
              </span>
            ))}
          </div>
          <div className="migration-path" />
          <div className="migration-destination">
            <Brand variant="stacked" />
          </div>
          <div className="migration-steps">
            {["Analyze", "Back up", "Map", "Transfer", "Validate"].map(
              (x, i) => (
                <span key={x}>
                  <b>0{i + 1}</b>
                  {x}
                </span>
              ),
            )}
          </div>
          <p>
            Design-stage targets. Adapters are not yet implemented or verified.
          </p>
        </div>
      </section>
      <section id="installation" className="container section installation">
        <div className="section-heading">
          <span className="eyebrow">06 / YOUR INFRASTRUCTURE STARTS HERE</span>
          <h2>Take the controls.</h2>
          <p>
            Start by understanding the foundation. Choose the path that matches
            your experience.
          </p>
        </div>
        <div className="install-layout">
          <div className="install-options">
            <article>
              <span className="option-number">01</span>
              <div>
                <h3>
                  The hands-on route <span className="pill">MANUAL</span>
                </h3>
                <p>
                  Review prerequisites, pinned sources and the manual setup
                  workflow. Linux runtime validation remains in progress.
                </p>
                <Link href="/docs" className="text-link">
                  Read the setup guide <ArrowRight size={16} />
                </Link>
              </div>
            </article>
            <article>
              <span className="option-number">02</span>
              <div>
                <h3>
                  A guided way forward <span className="pill">PLANNED</span>
                </h3>
                <p>
                  A future installer for installation, updates, migration and
                  diagnosis. Design documentation is available today.
                </p>
                <a href={`${github}/installer`} className="text-link">
                  Explore the installer design <ArrowRight size={16} />
                </a>
              </div>
            </article>
          </div>
          <div className="installation-terminal">
            <div className="window-bar">
              <span>
                <Terminal size={14} /> installer / design preview
              </span>
              <span>NOT EXECUTABLE</span>
            </div>
            <div className="install-terminal-body">
              <span className="cyan">IBISPANEL / LIFECYCLE OPERATIONS</span>
              <p>One guided experience. Six planned operations.</p>
              {[
                "Install IbisPanel",
                "Install Wings only",
                "Install IbisPanel + Wings",
                "Update an existing installation",
                "Migrate from another panel",
                "Diagnose or repair",
              ].map((x, i) => (
                <div key={x}>
                  <span>0{i + 1}</span>
                  {x}
                  <span className="muted">planned</span>
                </div>
              ))}
              <p className="terminal-note">
                Verified installation commands will appear with a tested
                release.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="community-section">
        <div className="container">
          <span className="eyebrow">07 / BUILT TOGETHER</span>
          <h2>
            Good software is open.
            <br />
            <span>Great software is shared.</span>
          </h2>
          <p>
            A foundation from Pterodactyl. An independent direction.
            <br />A place for your next contribution.
          </p>
          <a href={github} className="button primary">
            Build with us on GitHub <ArrowUpRight size={18} />
          </a>
          <div className="repo-links">
            {repositories.map((x) => (
              <a key={x} href={`${github}/${x}`}>
                {x}
                <ArrowUpRight size={12} />
              </a>
            ))}
          </div>
          <span className="small muted">
            No inflated numbers. Just the code and the people who care about it.
          </span>
        </div>
      </section>
      <section className="container section faq-section">
        <div className="section-heading">
          <span className="eyebrow">A FEW THINGS TO KNOW</span>
          <h2>Glad you asked.</h2>
          <p>
            Where the project stands,
            <br />
            and where it is headed.
          </p>
        </div>
        <div className="faq-list">
          {faq.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
