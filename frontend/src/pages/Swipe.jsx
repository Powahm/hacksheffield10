import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, RotateCcw, X } from "lucide-react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import SwipeCard from "../components/SwipeCard";
import TastePanel from "../components/TastePanel";
import Stylist from "../components/Stylist";

export default function Swipe() {
  const swipes = useStore((s) => s.swipes);
  const keptMap = useStore((s) => s.kept);
  const swipe = useStore((s) => s.swipe);
  const undo = useStore((s) => s.undo);
  const startOver = useStore((s) => s.startOver);

  const [pick, setPick] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | done | error
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const card = useRef(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const id = ++request.current;
    setStatus("loading");
    try {
      const data = await api.next(useStore.getState().swipes);
      if (id !== request.current) return;
      setTotal(data.total);
      if (data.product) {
        setPick(data);
        setStatus("ready");
      } else {
        setPick(null);
        setStatus("done");
      }
    } catch (e) {
      if (id !== request.current) return;
      setError(e.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = useCallback(
    (kept) => {
      if (!pick) return;
      swipe(pick.product, kept);
      load();
    },
    [pick, swipe, load]
  );

  useEffect(() => {
    function onKey(e) {
      if (status !== "ready" || e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") card.current?.fly(true);
      if (e.key === "ArrowLeft") card.current?.fly(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  const kept = Object.values(keptMap);
  const seen = new Set(swipes.map((s) => s.id)).size;

  return (
    <main className="page">
      <div className="swipe-layout">
        <div>
          <div className="stage">
            <div className="card-under" aria-hidden="true" />
            {status === "ready" && pick && (
              <SwipeCard key={pick.product.id} ref={card} pick={pick} onDecide={decide} />
            )}
            {status === "loading" && <div className="card-state skeleton" aria-label="Finding the next piece" />}
            {status === "done" && (
              <div className="card-state">
                <h2>You have seen all {total} pieces</h2>
                <p>Your kept pieces stay saved. Start over to swipe the rail again.</p>
                <div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      startOver();
                      load();
                    }}
                  >
                    Start over
                  </button>
                </div>
              </div>
            )}
            {status === "error" && (
              <div className="card-state">
                <h2>The feed did not load</h2>
                <p>{error}</p>
                <div>
                  <button className="btn btn-primary" onClick={load}>
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="controls">
            <button
              className="round"
              onClick={() => card.current?.fly(false)}
              disabled={status !== "ready"}
              aria-label="Pass"
            >
              <X size={26} />
            </button>
            <button
              className="round round-keep"
              onClick={() => card.current?.fly(true)}
              disabled={status !== "ready"}
              aria-label="Keep"
            >
              <Heart size={28} />
            </button>
            <button
              className="round"
              onClick={() => {
                undo();
                load();
              }}
              disabled={!swipes.length || status === "loading"}
              aria-label="Undo last swipe"
            >
              <RotateCcw size={22} />
            </button>
          </div>
          <p className="hint">
            Drag the card, or use <span className="kbd">Left</span> to pass and <span className="kbd">Right</span> to keep.
          </p>
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          <TastePanel kept={kept} seen={seen} total={total} />
          <Stylist product={status === "ready" ? pick?.product : null} keptIds={kept.map((p) => p.id)} />
        </div>
      </div>
    </main>
  );
}
