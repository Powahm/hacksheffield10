import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { category, price } from "../lib/format";
import { useStore } from "../lib/store";
import Photo from "../components/Photo";
import Stylist from "../components/Stylist";

export default function Item() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const kept = useStore((s) => s.kept);
  const bag = useStore((s) => s.bag);
  const addToBag = useStore((s) => s.addToBag);

  useEffect(() => {
    setProduct(null);
    setError("");
    api.product(id).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="page">
        <div className="empty" style={{ marginTop: 24 }}>
          <h2>This piece could not be found</h2>
          <p>{error}</p>
          <Link to="/swipe" className="btn btn-primary">
            Back to swiping
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page">
        <div className="item">
          <div className="photo skeleton" style={{ aspectRatio: 1, borderRadius: 6 }} />
        </div>
      </main>
    );
  }

  const bagged = bag.some((l) => l.product.id === product.id);

  return (
    <main className="page">
      <div className="item">
        <Photo product={product} eager />
        <div>
          <p className="muted small" style={{ margin: "0 0 8px" }}>
            {category(product.category)}
            {kept[product.id] ? ", in your kept list" : ""}
          </p>
          <h1>{product.name}</h1>
          <p className="price">{price(product.price)}</p>
          <p style={{ maxWidth: "60ch" }}>{product.description}</p>
          {product.tags?.length > 0 && (
            <ul className="taglist" aria-label="Tags">
              {product.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <div className="hero-actions" style={{ marginBottom: 32 }}>
            <button className="btn btn-primary" onClick={() => addToBag(product)} disabled={bagged}>
              {bagged ? "In bag" : "Add to bag"}
            </button>
            <Link to="/swipe" className="btn">
              Back to swiping
            </Link>
          </div>
          <Stylist product={product} keptIds={Object.keys(kept).map(Number)} />
        </div>
      </div>
    </main>
  );
}
