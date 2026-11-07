import { Link } from "react-router-dom";
import { category } from "../lib/format";
import Photo from "./Photo";

export default function TastePanel({ kept, seen, total }) {
  const counts = {};
  for (const p of kept) counts[p.category] = (counts[p.category] || 0) + 1;
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;
  const recent = kept.slice(-8).reverse();

  return (
    <section className="panel" aria-labelledby="taste-title">
      <div className="panel-section">
        <h2 id="taste-title">What the feed has learned</h2>
        <p className="muted small progress">
          {seen} of {total || "..."} pieces seen, {kept.length} kept
        </p>
      </div>

      <div className="panel-section">
        <h3>You keep</h3>
        {rows.length ? (
          <ul className="bars">
            {rows.map(([cat, n]) => (
              <li className="bar" key={cat}>
                <span>{category(cat)}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${(n / max) * 100}%`, display: "block" }} />
                </span>
                <span className="bar-n">{n}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Nothing yet. Keep a piece and the next picks will lean towards it.</p>
        )}
      </div>

      {recent.length > 0 && (
        <div className="panel-section">
          <h3>Recently kept</h3>
          <div className="thumbs">
            {recent.map((p) => (
              <Link to={`/item/${p.id}`} key={p.id} title={p.name}>
                <Photo product={p} className="thumb" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="panel-section">
        <h3>How it picks</h3>
        <p className="muted small" style={{ maxWidth: "60ch", margin: 0 }}>
          Gemini turns every piece into a list of 768 numbers that describes it. Your taste is a running
          average of what you keep minus what you pass, and the next card is the unseen piece closest to it.
          Now and then it shows something different, so the feed does not get stuck on one look.
        </p>
      </div>
    </section>
  );
}
