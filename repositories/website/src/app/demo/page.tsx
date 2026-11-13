import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";
import { Studio } from "@/components/Studio";
export const metadata: Metadata = {
  title: "Interactive demo",
  description:
    "Explore a simulated IbisPanel dashboard and customize the planned Ibis Studio experience.",
};
export default function Demo() {
  return (
    <main id="main" className="container demo-page">
      <div className="section-heading">
        <span className="eyebrow">YOUR SANDBOX. NO SIGN-IN REQUIRED.</span>
        <h1>
          Meet your next
          <br />
          <span className="gradient-text">control room.</span>
        </h1>
        <p>
          Switch workloads. Explore files. Try the console. Every metric, event
          and control is a client-side simulation. Nothing connects to real
          infrastructure.
        </p>
      </div>
      <Dashboard />
      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">MAKE IT YOURS / PLANNED CAPABILITIES</span>
          <h2>Welcome to Ibis Studio.</h2>
          <p>
            A browser-local customization concept. These controls preview future
            panel capabilities.
          </p>
        </div>
        <Studio />
      </section>
    </main>
  );
}
