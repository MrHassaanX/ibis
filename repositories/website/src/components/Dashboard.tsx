"use client";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Box,
  Check,
  ChevronRight,
  FileText,
  Folder,
  HardDrive,
  LayoutDashboard,
  Play,
  RotateCw,
  Square,
  Terminal,
  X,
} from "lucide-react";
import { workloads, views } from "@/lib/content";
export function Dashboard({
  initialView = "Console",
  compact = false,
}: {
  initialView?: (typeof views)[number];
  compact?: boolean;
}) {
  const [workload, setWorkload] = useState(0);
  const [view, setView] = useState<(typeof views)[number]>(initialView);
  const [running, setRunning] = useState(true);
  const [count, setCount] = useState(3);
  const [events, setEvents] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [file, setFile] = useState("");
  const fileTrigger = useRef<HTMLButtonElement | null>(null);
  function closeFile() {
    setFile("");
    fileTrigger.current?.focus();
  }
  const w = workloads[workload];
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visibleLines = 3;
    const timer = setInterval(() => {
      visibleLines += 1;
      setCount(visibleLines);
      if (visibleLines === 5) clearInterval(timer);
    }, 1600);
    return () => clearInterval(timer);
  }, []);
  function power(action: string) {
    setRunning(action !== "Stop");
    setEvents((e) =>
      [
        ...e,
        `${action === "Stop" ? "Stopped" : action === "Restart" ? "Restarted" : "Started"} ${w.name} (simulation only)`,
      ].slice(-4),
    );
  }
  return (
    <div className={`product-demo ${compact ? "compact-demo" : ""}`}>
      <div className="workload-tabs" aria-label="Workload selection">
        {workloads.map((x, i) => (
          <button
            key={x.id}
            aria-pressed={i === workload}
            onClick={() => {
              setWorkload(i);
              setEvents([]);
              setRunning(true);
            }}
          >
            <span style={{ background: x.color }} />
            {x.short}
          </button>
        ))}
      </div>
      <div className="dashboard">
        <div className="window-bar">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <span>workspace / {w.id}</span>
          <span className="simulation">
            <span /> SIMULATED PREVIEW
          </span>
        </div>
        <div className="dashboard-body">
          <aside className="dashboard-rail">
            <Box size={23} />
            <LayoutDashboard />
            <Terminal className="cyan" />
            <Folder />
            <HardDrive />
            <Activity />
            <span className="avatar">JD</span>
          </aside>
          <div className="dashboard-main">
            <div className="server-heading">
              <div className="server-icon" style={{ color: w.color }}>
                <Box size={24} />
              </div>
              <div>
                <h3>{w.name}</h3>
                <p>{w.type}</p>
              </div>
              <span className={`status ${running ? "" : "offline"}`}>
                <i />
                {running ? "Running" : "Stopped"}
              </span>
            </div>
            <div className="dashboard-tabs" aria-label="Preview views">
              {views.map((x) => (
                <button
                  key={x}
                  aria-pressed={view === x}
                  onClick={() => setView(x)}
                >
                  {x}
                </button>
              ))}
            </div>
            <div className="preview-content" key={`${view}-${workload}`}>
              {(view === "Console" || view === "Overview") && (
                <>
                  <div className="metrics">
                    {[
                      ["CPU load", running ? w.cpu : "0", "%"],
                      ["Memory", running ? w.memory : "0", " / 4 GiB"],
                      ["Storage", "6.2", " / 20 GiB"],
                    ].map(([label, value, unit], i) => (
                      <div className="metric" key={label}>
                        <span>
                          {label}
                          <Activity size={12} />
                        </span>
                        <strong>
                          {value}
                          <small>{unit}</small>
                        </strong>
                        <svg viewBox="0 0 180 28" aria-hidden="true">
                          <path
                            d={
                              i === 0
                                ? "M0 23L15 20L25 23L40 14L50 17L65 6L80 18L95 12L110 16L130 5L145 10L165 4L180 8"
                                : i === 1
                                  ? "M0 25L30 25L40 17L75 17L85 12L120 12L130 7L160 7L180 4"
                                  : "M0 24L35 22L60 20L90 16L120 14L150 8L180 6"
                            }
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                  <div className="console">
                    <div className="console-heading">
                      <span>
                        <Terminal size={13} />{" "}
                        {view === "Overview"
                          ? "Activity stream"
                          : "Server console"}
                      </span>
                      <span>UTF-8</span>
                    </div>
                    <div
                      className="console-lines"
                      role="log"
                      aria-label="Simulated console output"
                    >
                      {w.logs.slice(0, count).map((line, i) => (
                        <div key={line}>
                          <time>
                            14:0{i}:2{i}
                          </time>
                          <b>{i === 3 ? "EVENT" : "INFO"}</b>
                          <span>{line}</span>
                        </div>
                      ))}
                      {events.map((line, i) => (
                        <div key={`${i}-${line}`}>
                          <time>14:06:00</time>
                          <b>DEMO</b>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (command.trim()) {
                          setEvents((v) =>
                            [
                              ...v,
                              `Preview received “${command.slice(0, 80)}”. No command executed.`,
                            ].slice(-4),
                          );
                          setCommand("");
                        }
                      }}
                    >
                      <ChevronRight size={14} />
                      <input
                        aria-label="Simulated console command"
                        placeholder="Type a simulated command…"
                        value={command}
                        maxLength={80}
                        onChange={(e) => setCommand(e.target.value)}
                      />
                      <button aria-label="Send simulated command">↵</button>
                    </form>
                  </div>
                  <div className="console-footer">
                    <span>
                      <i className="signal" />
                      {w.detail}
                    </span>
                    <div className="power-controls">
                      <button onClick={() => power("Start")} disabled={running}>
                        <Play size={12} />
                        Start
                      </button>
                      <button onClick={() => power("Restart")}>
                        <RotateCw size={12} />
                        Restart
                      </button>
                      <button onClick={() => power("Stop")} disabled={!running}>
                        <Square size={11} />
                        Stop
                      </button>
                    </div>
                  </div>
                </>
              )}
              {view === "Files" && (
                <div className="data-view">
                  <div className="data-title">
                    <span>/ home / container</span>
                    <span>Read-only sample files</span>
                  </div>
                  {[
                    "plugins/",
                    "world/",
                    "server.properties",
                    "package.json",
                    "README.md",
                  ].map((name, i) => (
                    <button
                      className="file-row"
                      key={name}
                      onClick={(event) => {
                        fileTrigger.current = event.currentTarget;
                        setFile(name);
                      }}
                    >
                      {i < 2 ? <Folder size={17} /> : <FileText size={17} />}
                      <strong>{name}</strong>
                      <span>{i < 2 ? "Directory" : `${i + 1}.2 KB`}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}
              {view === "Backups" && (
                <DataTable
                  title="Recovery points"
                  headers={["Backup", "Size", "Status"]}
                  rows={[
                    [`daily-${w.id}-snapshot`, "2.1 GiB", "Sample · complete"],
                    ["before-update", "1.8 GiB", "Sample · complete"],
                  ]}
                />
              )}
              {view === "Schedules" && (
                <DataTable
                  title="Automate the routine"
                  headers={["Schedule", "When", "Action"]}
                  rows={[
                    [`Daily ${w.short} backup`, "03:00 UTC", "Back up"],
                    ["Gentle restart", "Sunday 04:00", "Restart"],
                  ]}
                />
              )}
              {view === "Network" && (
                <DataTable
                  title="Network allocations"
                  headers={["Endpoint", "Role", "State"]}
                  rows={[
                    [w.address, "Primary", "Simulated"],
                    ["10.0.0.8:25566", "Private", "Illustrative"],
                  ]}
                />
              )}
              {view === "Users" && (
                <DataTable
                  title="Access on your terms"
                  headers={["Member", "Role", "Access"]}
                  rows={[
                    ["Jamie Doe", "Owner", "All permissions"],
                    ["Alex Morgan", "Operator", "Console · Files"],
                  ]}
                />
              )}
              {view === "Admin" && (
                <DataTable
                  title="Node administration"
                  headers={["Node", "Workloads", "Status"]}
                  rows={[
                    ["eu-central-01", "3 samples", "Healthy"],
                    ["us-east-01", "1 sample", "Healthy"],
                  ]}
                />
              )}
            </div>
            <div className="dashboard-bottom">
              <span>
                eu-central-01 <span className="muted">/ Docker isolated</span>
              </span>
              <span>
                <Check size={11} /> Preview environment
              </span>
            </div>
          </div>
        </div>
      </div>
      {file && (
        <div
          className="file-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Sample ${file}`}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeFile();
            if (e.key === "Tab") {
              e.preventDefault();
            }
          }}
        >
          <div>
            <button
              autoFocus
              className="icon-button"
              aria-label="Close file preview"
              onClick={closeFile}
            >
              <X />
            </button>
            <FileText />
            <h3>{file}</h3>
            <pre>
              {file.endsWith("/")
                ? "Sample directory\nNo real server files are connected."
                : file === "package.json"
                  ? '{\n  "name": "example-workload",\n  "private": true\n}'
                  : "# IbisPanel preview\n# Read-only illustrative content\n# No infrastructure is connected."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
function DataTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="data-view">
      <h4>{title}</h4>
      <p className="small muted">
        Illustrative records · no live infrastructure
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={cell}>
                    {j === 0 ? (
                      <span className="table-name">
                        <Box size={14} />
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-note">
        <ArrowUpRight size={14} /> Explore the source to follow implementation.
      </p>
    </div>
  );
}
