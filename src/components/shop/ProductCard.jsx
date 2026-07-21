// src/components/shop/ProductCard.jsx
export default function ProductCard({ product, onAdd }) {
    return (
        <div
            style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                overflow: "hidden",
            }}
        >
            <div style={{ width: "100%", aspectRatio: "1 / 1", background: "#f2f2f2" }}>
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
                            color: "#999",
                        }}
                    >
                        ไม่มีรูป
                    </div>
                )}
            </div>
            <div style={{ padding: 10 }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: 14 }}>{product.name}</h4>
                <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666" }}>
                    {product.desc}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{product.price.toLocaleString()} บาท</strong>
                    <button onClick={() => onAdd(product)}>+ ใส่ตะกร้า</button>
                </div>
            </div>
        </div>
    );
}