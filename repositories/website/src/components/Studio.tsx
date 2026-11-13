"use client";
import { useState, type CSSProperties } from "react";
import {
  Box,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
const defaults = {
  appearance: "dark",
  accent: "#00e5ec",
  layout: "grid",
  navigation: "modern",
  radius: "12",
  density: "comfortable",
};
export function Studio() {
  const [s, set] = useState(defaults);
  const [selected, select] = useState("");
  function update(key: string, value: string) {
    set((v) => ({ ...v, [key]: value }));
  }
  return (
    <div className="studio-workbench">
      <div className="studio-controls">
        <div className="control-title">
          <SlidersHorizontal size={17} />
          <strong>Your workspace. Your rules.</strong>
        </div>
        <Control
          label="Appearance"
          options={["dark", "light"]}
          value={s.appearance}
          onChange={(v) => update("appearance", v)}
        />
        <fieldset>
          <legend>Accent color</legend>
          <div className="swatches">
            {[
              ["Cyan", "#00e5ec"],
              ["Violet", "#b0a0ff"],
              ["Mint", "#6ee7b7"],
              ["Amber", "#ffcc80"],
              ["Rose", "#ff9dbd"],
            ].map(([name, color]) => (
              <button
                key={color}
                style={{ background: color }}
                aria-label={`${name} accent`}
                aria-pressed={s.accent === color}
                onClick={() => update("accent", color)}
              >
                {s.accent === color && <Check size={17} />}
              </button>
            ))}
          </div>
        </fieldset>
        <Control
          label="Server layout"
          options={["grid", "list"]}
          value={s.layout}
          onChange={(v) => update("layout", v)}
        />
        <Control
          label="Navigation"
          options={["modern", "classic", "compact"]}
          value={s.navigation}
          onChange={(v) => update("navigation", v)}
        />
        <fieldset>
          <legend>Corner radius</legend>
          <div className="segmented">
            {[
              ["0", "Sharp"],
              ["12", "Soft"],
              ["22", "Round"],
            ].map(([v, l]) => (
              <button
                key={v}
                aria-pressed={s.radius === v}
                onClick={() => update("radius", v)}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>
        <Control
          label="Density"
          options={["comfortable", "compact"]}
          value={s.density}
          onChange={(v) => update("density", v)}
        />
        <button
          className="reset"
          onClick={() => {
            set(defaults);
            select("");
          }}
        >
          <RotateCcw size={14} />
          Reset to defaults
        </button>
      </div>
      <div
        className={`studio-preview ${s.appearance} nav-${s.navigation} density-${s.density}`}
        style={
          {
            "--studio-accent": s.accent,
            "--studio-radius": `${s.radius}px`,
          } as CSSProperties
        }
        data-testid="studio-preview"
      >
        <div className="studio-top">
          <span className="studio-emblem">
            <Box size={20} /> <b>Workspace</b>
          </span>
          <span className="small">
            Personal workspace <ChevronDown size={12} />
          </span>
          <span className="avatar">JD</span>
        </div>
        <div className="studio-interior">
          <aside className="studio-sidebar">
            <span className="active">
              <LayoutGrid size={17} />
              <b>Servers</b>
            </span>
            <span>
              <List size={17} />
              <b>Activity</b>
            </span>
            <span>
              <SlidersHorizontal size={17} />
              <b>Settings</b>
            </span>
          </aside>
          <div className="studio-canvas">
            <div className="studio-caption">
              <div>
                <span className="small">YOUR INFRASTRUCTURE</span>
                <h3>A little more you.</h3>
              </div>
              <span className="studio-glyph">
                <Search size={18} />
              </span>
            </div>
            <p className="studio-description">
              Everything you run. Exactly how you like it.
            </p>
            <div className={`studio-servers layout-${s.layout}`}>
              {[
                ["Survival Collective", "Minecraft · Paper", "24%", "2.4 GiB"],
                ["Orbit application", "Node.js · Next.js", "18%", "0.8 GiB"],
                ["Community companion", "Discord.js · Bot", "6%", "0.3 GiB"],
              ].map(([name, type, cpu, memory], i) => (
                <button
                  className="studio-server"
                  key={name}
                  aria-pressed={selected === name}
                  onClick={() => select(selected === name ? "" : name)}
                >
                  <div className={`server-art art-${i}`}>
                    <Box size={30} />
                    <span className="status">
                      <i />
                      Running
                    </span>
                  </div>
                  <div className="studio-server-info">
                    <strong>{name}</strong>
                    <span>{type}</span>
                    <div className="studio-usage">
                      <span>
                        CPU <b>{cpu}</b>
                      </span>
                      <span>
                        RAM <b>{memory}</b>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="studio-notice" role="status">
              {selected
                ? `${selected} selected · illustrative metrics and status`
                : "Click a server to inspect its preview state."}
            </div>
            <div className="studio-summary">
              <span>
                <i className="signal" /> All sample systems operational
              </span>
              <span>3 workloads</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Control({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="segmented">
        {options.map((v) => (
          <button
            key={v}
            aria-pressed={v === value}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
