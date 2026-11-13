import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import "./refinements.css";
import { Header } from "@/components/Header";
import { Brand } from "@/components/Brand";
import Link from "next/link";
const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: {
    default: "IbisPanel — One Panel. Every Workload.",
    template: "%s · IbisPanel",
  },
  description:
    "Independent, open-source hosting management software. Explore the IbisPanel foundation, interactive product previews and the road ahead.",
  openGraph: {
    title: "IbisPanel — One Panel. Every Workload.",
    description:
      "Your infrastructure. Your rules. An independent open-source hosting management project.",
    images: [{ url: "/brand/social.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/brand/social.png"] },
  icons: { icon: "/brand/favicon.png" },
  robots: process.env.NEXT_PUBLIC_SITE_URL
    ? { index: true, follow: true }
    : { index: false, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        {children}
        <footer className="site-footer">
          <div className="container footer-top">
            <div>
              <Link href="/" aria-label="IbisPanel home">
                <Brand variant="white" />
              </Link>
              <p>
                Built in the open.
                <br />
                Made to be yours.
              </p>
            </div>
            <div>
              <h4>Explore</h4>
              <Link href="/demo">Interactive demo</Link>
              <Link href="/#studio">Ibis Studio</Link>
              <Link href="/#migration">Migration roadmap</Link>
            </div>
            <div>
              <h4>Build with us</h4>
              <a href="https://github.com/IbisPanel">GitHub organization</a>
              <Link href="/docs">Documentation</Link>
              <Link href="/brand">Brand assets</Link>
            </div>
            <div className="footer-note">
              <span className="eyebrow">INDEPENDENT. OPEN SOURCE.</span>
              <p>
                Built on Pterodactyl, with gratitude to its authors and
                contributors. Inherited MIT licenses and attribution are
                preserved.
              </p>
              <a href="https://github.com/pterodactyl/panel">
                Explore the upstream project ↗
              </a>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>© 2026 IbisPanel contributors</span>
            <span>Hosting management software. Your infrastructure.</span>
            <a href="#main">Back to top ↑</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
