import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Swipe from "./pages/Swipe";
import Kept from "./pages/Kept";
import Bag from "./pages/Bag";
import Item from "./pages/Item";
import Studio from "./pages/Studio";

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/swipe" element={<Swipe />} />
          <Route path="/kept" element={<Kept />} />
          <Route path="/bag" element={<Bag />} />
          <Route path="/item/:id" element={<Item />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="footer">
          Built at HackSheffield 10. Products from DummyJSON; prices are demo prices.{" "}
          <Link to="/studio">Brand studio</Link>
        </footer>
      </div>
    </BrowserRouter>
  );
}
