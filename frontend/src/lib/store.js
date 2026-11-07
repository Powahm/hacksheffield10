import { create } from "zustand";
import { persist } from "zustand/middleware";

// Everything about a visitor lives in their browser: the server is stateless.
export const useStore = create(
  persist(
    (set, get) => ({
      swipes: [], // [{ id, kept }] oldest first; sent to /feed/next
      kept: {}, // id -> product, for the Kept page and the stylist
      bag: [], // [{ product, qty }]

      swipe: (product, kept) =>
        set((s) => {
          const nextKept = { ...s.kept };
          if (kept) nextKept[product.id] = product;
          else delete nextKept[product.id];
          return { swipes: [...s.swipes, { id: product.id, kept }], kept: nextKept };
        }),

      undo: () =>
        set((s) => {
          const last = s.swipes[s.swipes.length - 1];
          if (!last) return s;
          const nextKept = { ...s.kept };
          delete nextKept[last.id];
          return { swipes: s.swipes.slice(0, -1), kept: nextKept };
        }),

      unkeep: (id) =>
        set((s) => {
          const nextKept = { ...s.kept };
          delete nextKept[id];
          return {
            kept: nextKept,
            swipes: s.swipes.map((w) => (w.id === id ? { ...w, kept: false } : w)),
          };
        }),

      startOver: () => set({ swipes: [] }),

      addToBag: (product) =>
        set((s) => {
          const line = s.bag.find((l) => l.product.id === product.id);
          if (line) {
            return { bag: s.bag.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l)) };
          }
          return { bag: [...s.bag, { product, qty: 1 }] };
        }),

      setQty: (id, qty) =>
        set((s) => ({
          bag: qty <= 0 ? s.bag.filter((l) => l.product.id !== id) : s.bag.map((l) => (l.product.id === id ? { ...l, qty } : l)),
        })),

      clearBag: () => set({ bag: [] }),

      inBag: (id) => get().bag.some((l) => l.product.id === id),
    }),
    { name: "trendswipe-v2" }
  )
);

export const bagCount = (bag) => bag.reduce((n, l) => n + l.qty, 0);
