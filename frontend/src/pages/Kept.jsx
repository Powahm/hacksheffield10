import { Link } from "react-router-dom";
import { category, price } from "../lib/format";
import { useStore } from "../lib/store";
import Photo from "../components/Photo";

export default function Kept() {
  const kept = Object.values(useStore((s) => s.kept)).reverse();
  const unkeep = useStore((s) => s.unkeep);
  const addToBag = useStore((s) => s.addToBag);
  const bag = useStore((s) => s.bag);

  return (
    <main className="page">
      <h1 className="page-title">Kept</h1>
      <p className="lede">Everything you swiped right on. Removing a piece here also tells the feed you went off it.</p>

      {kept.length === 0 ? (
        <div className="empty">
          <h2>Nothing kept yet</h2>
          <p>Swipe right on a piece you like and it will wait for you here.</p>
          <Link to="/swipe" className="btn btn-primary">
            Start swiping
          </Link>
        </div>
      ) : (
        <ul className="grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {kept.map((p) => {
            const bagged = bag.some((l) => l.product.id === p.id);
            return (
              <li className="tile" key={p.id}>
                <Photo product={p} />
                <div className="tile-body">
                  <Link to={`/item/${p.id}`} className="tile-name">
                    {p.name}
                  </Link>
                  <div className="tile-meta">
                    <span>{category(p.category)}</span>
                    <span>{price(p.price)}</span>
                  </div>
                  <div className="tile-actions">
                    <button className="btn btn-primary" onClick={() => addToBag(p)} disabled={bagged}>
                      {bagged ? "In bag" : "Add to bag"}
                    </button>
                    <button className="btn" onClick={() => unkeep(p.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
