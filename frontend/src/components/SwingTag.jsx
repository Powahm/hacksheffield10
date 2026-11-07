import { category, percent, price } from "../lib/format";

function why(pick) {
  if (!pick) return null;
  if (pick.mode === "match" && pick.because) {
    return (
      <>
        <strong>{percent(pick.score)} similar</strong>
        to the {pick.because.name} you kept
      </>
    );
  }
  if (pick.mode === "explore") {
    return (
      <>
        <strong>Something different</strong>
        to check your range
      </>
    );
  }
  return (
    <>
      <strong>A first pick</strong>
      keep or pass to teach the feed
    </>
  );
}

// The swing tag: price, category and, when it came from the feed, why it was picked.
export default function SwingTag({ product, pick, swing = false }) {
  const reason = why(pick);
  return (
    <>
      <svg className="tag-string" viewBox="0 0 60 46" aria-hidden="true">
        <path d="M2 2 C 20 10, 40 20, 56 44" fill="none" stroke="#8a7a57" strokeWidth="1.5" />
      </svg>
      <div className={`tag ${swing ? "tag-swing" : ""}`}>
        <div className="tag-price">{price(product.price)}</div>
        <div className="tag-category">{category(product.category)}</div>
        {reason && <div className="tag-why">{reason}</div>}
      </div>
    </>
  );
}
