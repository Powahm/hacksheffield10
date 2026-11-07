import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { price } from "../lib/format";
import { bagCount, useStore } from "../lib/store";
import Photo from "../components/Photo";

export default function Bag() {
  const bag = useStore((s) => s.bag);
  const setQty = useStore((s) => s.setQty);
  const clearBag = useStore((s) => s.clearBag);
  const [placed, setPlaced] = useState(null);

  const subtotal = bag.reduce((sum, l) => sum + Number(l.product.price) * l.qty, 0);
  const delivery = subtotal >= 100 || subtotal === 0 ? 0 : 4.99;

  if (placed) {
    return (
      <main className="page">
        <div className="empty" style={{ marginTop: 24 }}>
          <h2>Demo order placed</h2>
          <p>
            {placed.count} {placed.count === 1 ? "item" : "items"} for {price(placed.total)}. TrendSwipe is a demo, so
            nothing was charged and nothing will ship.
          </p>
          <Link to="/swipe" className="btn btn-primary">
            Keep swiping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">Bag</h1>
      {bag.length === 0 ? (
        <div className="empty">
          <h2>Your bag is empty</h2>
          <p>Add pieces from your kept list, or from any item page.</p>
          <Link to="/kept" className="btn btn-primary">
            Go to kept
          </Link>
        </div>
      ) : (
        <div className="bag">
          <ul className="lines">
            {bag.map(({ product: p, qty }) => (
              <li className="line" key={p.id}>
                <Photo product={p} />
                <div>
                  <Link to={`/item/${p.id}`} style={{ textDecoration: "none" }}>
                    <p className="line-name">{p.name}</p>
                  </Link>
                  <p className="muted small" style={{ margin: "2px 0 8px" }}>
                    {price(p.price)} each
                  </p>
                  <div className="qty">
                    <button onClick={() => setQty(p.id, qty - 1)} aria-label={`One fewer ${p.name}`}>
                      <Minus size={16} />
                    </button>
                    <span aria-label="Quantity">{qty}</span>
                    <button onClick={() => setQty(p.id, qty + 1)} aria-label={`One more ${p.name}`}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <strong style={{ fontVariantNumeric: "tabular-nums" }}>{price(p.price * qty)}</strong>
              </li>
            ))}
          </ul>

          <aside className="summary" aria-label="Order summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{price(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{delivery ? price(delivery) : "Free"}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{price(subtotal + delivery)}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setPlaced({ count: bagCount(bag), total: subtotal + delivery });
                clearBag();
              }}
            >
              Place demo order
            </button>
            <p className="muted small" style={{ margin: 0 }}>
              This is a demo shop. No payment details are taken and nothing is charged.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
