import { Brand } from "@/components/Brand";
export default function BrandPage() {
  return (
    <main id="main" className="container document-page">
      <span className="eyebrow">IBISPANEL / IDENTITY</span>
      <h1>Distinctly Ibis.</h1>
      <p className="lead">
        The original brand artwork, preserved in its original proportions.
        Download the supplied PNGs below.
      </p>
      <div className="brand-gallery">
        {(
          [
            ["horizontal", "IBIS-HORIZONTAL-VERSION.png"],
            ["stacked", "IBIS-STACKED-VERSION.png"],
            ["white", "IBIS-WHITE-MONOCHROME.png"],
            ["black", "IBIS-BLACK-&-WHITE.png"],
            ["icon", "IBIS-ICON.png"],
          ] as const
        ).map(([variant, file]) => (
          <a
            key={variant}
            href={`/brand/${encodeURIComponent(file)}`}
            download
            className={`brand-sample sample-${variant}`}
          >
            <Brand variant={variant} />
            <span>Download {variant} artwork ↓</span>
          </a>
        ))}
      </div>
    </main>
  );
}
