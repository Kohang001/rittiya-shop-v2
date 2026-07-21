// src/components/shop/ShopCard.jsx
import { Link } from "react-router-dom";

export default function ShopCard({ shop }) {
    return (
        <Link
            to={`/shop/${shop.id}`}
            style={{
                display: "block",
                border: "1px solid #ddd",
                borderRadius: 12,
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                transition: "transform 0.15s",
            }}
        >
            <div
                style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    background: "#f2f2f2",
                    overflow: "hidden",
                }}
            >
                {shop.logoUrl ? (
                    <img
                        src={shop.logoUrl}
                        alt={shop.name}
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
                        ไม่มีโลโก้
                    </div>
                )}
            </div>
            <div style={{ padding: 12 }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: 16 }}>{shop.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{shop.slogan}</p>
                {shop.category && (
                    <span
                        style={{
                            display: "inline-block",
                            marginTop: 8,
                            fontSize: 11,
                            background: "#eef",
                            color: "#334",
                            padding: "2px 8px",
                            borderRadius: 999,
                        }}
                    >
                        {shop.category}
                    </span>
                )}
            </div>
        </Link>
    );
}