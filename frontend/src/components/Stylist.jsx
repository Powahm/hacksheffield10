import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

// Replies are plain text, but models still slip into Markdown bullets and bold.
function Reply({ text }) {
  const blocks = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\*\*(.+?)\*\*/g, "$1").trim();
    if (!line) continue;
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else blocks.push({ type: "p", text: line });
  }
  return blocks.map((b, i) =>
    b.type === "ul" ? (
      <ul key={i} className="reply-list">
        {b.items.map((it, j) => (
          <li key={j}>{it}</li>
        ))}
      </ul>
    ) : (
      <p key={i} className="reply-p">
        {b.text}
      </p>
    )
  );
}

const STARTERS = ["What goes with this?", "Would this work for an interview?", "What should I look for next?"];

export default function Stylist({ product, keptIds }) {
  const [log, setLog] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [log, busy]);

  async function ask(message) {
    const q = message.trim();
    if (!q || busy) return;
    setError("");
    setText("");
    const history = log.slice(-10);
    setLog((l) => [...l, { role: "user", content: q }]);
    setBusy(true);
    try {
      const { reply } = await api.chat({
        message: q,
        history,
        product_id: product?.id,
        kept_ids: keptIds.slice(-20),
      });
      setLog((l) => [...l, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message);
      setLog((l) => l.slice(0, -1));
      setText(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stylist" aria-labelledby="stylist-title">
      <h3 id="stylist-title" style={{ margin: 0 }}>
        Ask the stylist
      </h3>
      <p className="muted small" style={{ margin: "4px 0 0" }}>
        {product ? `About the ${product.name}, and what you have kept so far.` : "About what you have kept so far."}
      </p>

      {log.length > 0 && (
        <div className="stylist-log" aria-live="polite">
          {log.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="msg msg-user">
                {m.content}
              </p>
            ) : (
              <div key={i} className="msg msg-stylist">
                <Reply text={m.content} />
              </div>
            )
          )}
          {busy && <p className="msg msg-stylist muted">Thinking about it...</p>}
          <span ref={end} />
        </div>
      )}

      {log.length === 0 && (
        <div className="chips" style={{ marginTop: 12 }}>
          {STARTERS.map((s) => (
            <button key={s} className="chip" type="button" onClick={() => ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="ask"
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
      >
        <label htmlFor="stylist-q" className="sr-only">
          Your question
        </label>
        <input
          id="stylist-q"
          className="field"
          value={text}
          maxLength={500}
          placeholder="Ask about fit, pairing or occasion"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !text.trim()}>
          Ask
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
