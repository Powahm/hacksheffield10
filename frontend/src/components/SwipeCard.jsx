import { forwardRef, useImperativeHandle } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import Photo from "./Photo";
import SwingTag from "./SwingTag";

const THRESHOLD = 110;

// A draggable product card. Drag right to keep, left to pass; the parent can also
// call ref.fly(true|false) from the buttons or the keyboard.
const SwipeCard = forwardRef(function SwipeCard({ pick, onDecide }, ref) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-10, 10]);
  const keepOpacity = useTransform(x, [30, THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-THRESHOLD, -30], [1, 0]);
  const { product } = pick;

  const fly = (kept) => {
    if (reduce) return onDecide(kept);
    const width = typeof window === "undefined" ? 600 : window.innerWidth;
    animate(x, kept ? width : -width, { duration: 0.28, ease: "easeIn" }).then(() => onDecide(kept));
  };

  useImperativeHandle(ref, () => ({ fly }));

  return (
    <motion.article
      className="card"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (info.offset.x > THRESHOLD || info.velocity.x > 700) fly(true);
        else if (info.offset.x < -THRESHOLD || info.velocity.x < -700) fly(false);
      }}
      aria-label={product.name}
    >
      <SwingTag product={product} pick={pick} swing />
      <motion.span className="stamp stamp-keep" style={{ opacity: keepOpacity }} aria-hidden="true">
        Keep
      </motion.span>
      <motion.span className="stamp stamp-pass" style={{ opacity: passOpacity }} aria-hidden="true">
        Pass
      </motion.span>
      <Photo product={product} eager />
      <div className="card-body">
        <h2 className="card-name">{product.name}</h2>
        <p className="card-desc">{product.description}</p>
        <Link to={`/item/${product.id}`} className="small muted" onPointerDown={(e) => e.stopPropagation()}>
          Details
        </Link>
      </div>
    </motion.article>
  );
});

export default SwipeCard;
