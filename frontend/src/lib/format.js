const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const price = (n) => money.format(Number(n) || 0);

// "womens-dresses" -> "Women's dresses", "mens-shirts" -> "Men's shirts"
export function category(slug = "") {
  const words = String(slug).split("-").filter(Boolean);
  if (!words.length) return "";
  const map = { womens: "Women's", mens: "Men's" };
  const out = words.map((w, i) => map[w] || (i === 0 ? w[0].toUpperCase() + w.slice(1) : w));
  return out.join(" ");
}

export const percent = (score) => `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%`;
