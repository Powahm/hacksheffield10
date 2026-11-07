import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { category, price } from "../lib/format";
import Photo from "../components/Photo";

const KEY = "trendswipe-studio-key";
const blank = { name: "", price: "", category: "", image_url: "", description: "", tags: "" };

function readKey() {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

function ProductDialog({ open, initial, onClose, onSave }) {
  const ref = useRef(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      setForm(initial ? { ...initial, tags: (initial.tags || []).join(", ") } : blank);
      setError("");
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({ ...form, price: Number(form.price) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="product-dialog-title">
      <h2 id="product-dialog-title">{initial ? "Edit product" : "Add product"}</h2>
      <form className="form" onSubmit={submit}>
        <label>
          Name
          <input className="field" required value={form.name} onChange={set("name")} />
        </label>
        <label>
          Price in dollars
          <input className="field" required type="number" min="0" step="0.01" value={form.price} onChange={set("price")} />
        </label>
        <label>
          Category
          <input className="field" placeholder="womens-dresses" value={form.category} onChange={set("category")} />
        </label>
        <label>
          Image URL
          <input className="field" type="url" value={form.image_url || ""} onChange={set("image_url")} />
        </label>
        <label>
          Description
          <textarea className="field" value={form.description || ""} onChange={set("description")} />
        </label>
        <label>
          Tags, separated by commas
          <input className="field" value={form.tags} onChange={set("tags")} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving..." : initial ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function Studio() {
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [token, setToken] = useState(readKey);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null closed, {} new, product edit
  const [toast, setToast] = useState("");

  const refresh = () =>
    api
      .products()
      .then((p) => {
        setProducts(p);
        setLoadError("");
      })
      .catch((e) => setLoadError(e.message));

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q));
  }, [products, query]);

  function saveKey(value) {
    setToken(value);
    try {
      sessionStorage.setItem(KEY, value);
    } catch {
      /* private mode: key lasts for this page only */
    }
  }

  async function save(data) {
    const isNew = !editing?.id;
    if (isNew) await api.createProduct(data, token);
    else await api.updateProduct(editing.id, data, token);
    setEditing(null);
    setToast(isNew ? "Product added" : "Changes saved");
    refresh();
  }

  async function remove(p) {
    if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(p.id, token);
      setToast("Product deleted");
      refresh();
    } catch (e) {
      setToast(e.message);
    }
  }

  return (
    <main className="page">
      <h1 className="page-title">Brand studio</h1>
      <p className="lede">
        Add, edit and remove the pieces in the feed. Each save re-describes the piece with Gemini so the recommender can
        place it.
      </p>

      <div className="notice">
        <label htmlFor="studio-key" style={{ fontWeight: 600 }}>
          Studio key
        </label>
        <div className="ask" style={{ marginTop: 6, maxWidth: 420 }}>
          <input
            id="studio-key"
            className="field"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => saveKey(e.target.value)}
            placeholder="Needed to save changes"
          />
        </div>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Anyone can browse the catalogue. Changes need the key set on the server.
        </p>
      </div>

      <div className="toolbar">
        <label htmlFor="studio-search" className="sr-only">
          Filter products
        </label>
        <input
          id="studio-search"
          className="field"
          placeholder="Filter by name or category"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="muted small">
          {shown.length} of {products.length}
        </span>
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setEditing({})}>
          Add product
        </button>
      </div>

      {loadError && <p className="error">{loadError}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Photo</span>
              </th>
              <th scope="col">Name</th>
              <th scope="col">Category</th>
              <th scope="col" style={{ textAlign: "right" }}>
                Price
              </th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td style={{ width: 64 }}>
                  <Photo product={p} className="thumb" />
                </td>
                <td>{p.name}</td>
                <td>{category(p.category)}</td>
                <td className="num">{price(p.price)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-quiet" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button className="btn btn-quiet" onClick={() => remove(p)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductDialog
        open={editing !== null}
        initial={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
        onSave={save}
      />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
