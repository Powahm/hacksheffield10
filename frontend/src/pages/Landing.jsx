import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Photo from "../components/Photo";
import SwingTag from "../components/SwingTag";

const FAN = [
  { rotate: -9, x: "-92%", y: 30 },
  { rotate: 7, x: "-8%", y: 40 },
  { rotate: -1, x: "-50%", y: 0 },
];

export default function Landing() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .products()
      .then((all) => {
        const byCategory = {};
        for (const p of all) if (p.image_url && !byCategory[p.category]) byCategory[p.category] = p;
        setItems(Object.values(byCategory).slice(0, 3));
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <h1>Swipe through clothes. The feed learns what you keep.</h1>
          <p>Keep the pieces you like, pass on the rest. Every swipe moves the next pick closer to your taste.</p>
          <div className="hero-actions">
            <Link to="/swipe" className="btn btn-primary">
              Start swiping
            </Link>
            <a href="#how" className="btn btn-quiet">
              How it works
            </a>
          </div>
        </div>

        <div className="fan" aria-hidden="true">
          {items.map((p, i) => (
            <div
              key={p.id}
              className="fan-card"
              style={{ transform: `translateX(${FAN[i].x}) translateY(${FAN[i].y}px) rotate(${FAN[i].rotate}deg)` }}
            >
              {i === items.length - 1 && <SwingTag product={p} />}
              <Photo product={p} eager />
              <div className="fan-name">{p.name}</div>
            </div>
          ))}
        </div>
      </section>

      <ol className="steps" id="how">
        <li>
          <h2>Swipe</h2>
          <p>Drag right to keep a piece, left to pass. Arrow keys work too.</p>
        </li>
        <li>
          <h2>Watch it learn</h2>
          <p>Each card's tag says why it was picked, and how close it is to something you kept.</p>
        </li>
        <li>
          <h2>Ask the stylist</h2>
          <p>Ask what goes with the piece in front of you. The answer uses what you have kept.</p>
        </li>
      </ol>
    </main>
  );
}
