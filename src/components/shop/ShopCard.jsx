// src/components/shop/ShopCard.jsx
import { Link } from "react-router-dom";

export default function ShopCard({ shop }) {
    const isClosed = shop.isOpen === false;

    return (
        <Link to={`/shop/${shop.id}`} className="card" style={{ display: "block", overflow: "hidden", color: "inherit", position: "relative" }}>
            <div style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--color-bg-subtle)", position: "relative" }}>
                {shop.logoUrl ? (
                    <img src={shop.logoUrl} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                        ไม่มีโลโก้
                    </div>
                )}
                {isClosed && (
                    <span
                        style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "rgba(15,23,42,0.75)",
                            color: "#fff",
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                        }}
                    >
                        ปิดชั่วคราว
                    </span>
                )}
            </div>
            <div style={{ padding: 12 }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: 16 }}>{shop.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>{shop.slogan}</p>
                {shop.category && (
                    <span
                        style={{
                            display: "inline-block",
                            marginTop: 8,
                            fontSize: 11,
                            background: "var(--color-primary-bg)",
                            color: "var(--color-primary-hover)",
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