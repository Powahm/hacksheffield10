import { useState } from "react";

export default function Photo({ product, className = "", eager = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`photo ${className}`}>
      {product?.image_url && !failed ? (
        <img
          src={product.image_url}
          alt={product.name || ""}
          loading={eager ? "eager" : "lazy"}
          draggable="false"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="photo-missing">No photo yet</span>
      )}
    </div>
  );
}
