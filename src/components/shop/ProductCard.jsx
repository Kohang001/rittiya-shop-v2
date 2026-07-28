// src/components/shop/ProductCard.jsx
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductCard({ product, onAdd, disabled }) {
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--color-bg-subtle)" }}>
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        ไม่มีรูป
                    </div>
                )}
            </div>
            <div style={{ padding: 10 }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: 14 }}>{product.name}</h4>
                <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "var(--color-text-muted)" }}>{product.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{formatCurrency(product.price)}</strong>
                    <button onClick={() => onAdd(product)} disabled={disabled}>
                        + ใส่ตะกร้า
                    </button>
                </div>
            </div>
        </div>
    );
}