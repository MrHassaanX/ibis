"use client";
import { useState } from "react";
import { ArrowUpRight, Blocks, Code2, Egg, Palette } from "lucide-react";
const entries = [
  {
    title: "A home for every runtime",
    category: "Eggs",
    icon: Egg,
    text: "Explore the existing game, application and language Egg foundations.",
    tag: "Official repository",
    url: "https://github.com/IbisPanel/eggs",
  },
  {
    title: "Make room for your ideas",
    category: "Extensions",
    icon: Blocks,
    text: "An illustrative extension concept for bringing your own workflows into the panel.",
    tag: "Illustrative concept",
    url: "https://github.com/IbisPanel/panel",
  },
  {
    title: "A different point of view",
    category: "Themes",
    icon: Palette,
    text: "Explore visual possibilities in the Ibis Studio customization preview.",
    tag: "Planned capability",
    url: "#studio",
  },
  {
    title: "Build the missing connection",
    category: "Integrations",
    icon: Code2,
    text: "Follow the inherited API foundation and contribute to the developer experience.",
    tag: "Developer foundation",
    url: "https://github.com/IbisPanel/docs",
  },
];
export function Ecosystem() {
  const [filter, set] = useState("All");
  return (
    <>
      <div className="catalog-filters" aria-label="Ecosystem categories">
        {["All", "Eggs", "Extensions", "Themes", "Integrations"].map((x) => (
          <button key={x} aria-pressed={x === filter} onClick={() => set(x)}>
            {x}
          </button>
        ))}
      </div>
      <div className="ecosystem-grid">
        {entries
          .filter((e) => filter === "All" || e.category === filter)
          .map((e) => (
            <a
              href={e.url}
              className={`ecosystem-card ecosystem-${e.category.toLowerCase()}`}
              key={e.title}
            >
              <div className="catalog-art">
                <e.icon strokeWidth={1} size={70} />
                <span>{e.category}</span>
              </div>
              <div className="catalog-copy">
                <span className="eyebrow">{e.tag}</span>
                <h3>
                  {e.title}
                  <ArrowUpRight size={18} />
                </h3>
                <p>{e.text}</p>
              </div>
            </a>
          ))}
      </div>
    </>
  );
}
