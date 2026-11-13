"use client";
import Link from "next/link";
import { Menu, X, ArrowUpRight, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";
export function Header() {
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link href="/" aria-label="IbisPanel home" className="nav-brand">
          <Brand />
        </Link>
        <nav
          aria-label="Main navigation"
          id="main-navigation"
          className={open ? "navigation open" : "navigation"}
        >
          {["Features", "Showcase", "Ibis Studio", "Eggs", "Migration"].map(
            (x, i) => (
              <Link
                onClick={() => setOpen(false)}
                key={x}
                href={`/#${["features", "showcase", "studio", "eggs", "migration"][i]}`}
              >
                {x}
              </Link>
            ),
          )}
          <Link onClick={() => setOpen(false)} href="/docs">
            Docs <ArrowUpRight size={12} />
          </Link>
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button"
            aria-label={light ? "Use dark theme" : "Use light theme"}
            onClick={() => {
              setLight(!light);
              document.documentElement.dataset.theme = light ? "dark" : "light";
            }}
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <a className="github-nav" href="https://github.com/IbisPanel">
            GitHub <ArrowUpRight size={14} />
          </a>
          <button
            className="icon-button mobile-toggle"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
