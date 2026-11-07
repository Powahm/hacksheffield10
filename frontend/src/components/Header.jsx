import { Link, NavLink } from "react-router-dom";
import { bagCount, useStore } from "../lib/store";

export default function Header() {
  const keptCount = useStore((s) => Object.keys(s.kept).length);
  const inBag = useStore((s) => bagCount(s.bag));
  return (
    <header className="topbar">
      <Link to="/" className="wordmark">
        TrendSwipe
      </Link>
      <nav className="nav" aria-label="Main">
        <NavLink to="/swipe">Swipe</NavLink>
        <NavLink to="/kept">
          Kept<span className="count">{keptCount}</span>
        </NavLink>
        <NavLink to="/bag">
          Bag<span className="count">{inBag}</span>
        </NavLink>
      </nav>
    </header>
  );
}
