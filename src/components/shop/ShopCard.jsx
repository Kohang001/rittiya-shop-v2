// src/components/shop/ShopCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";
import Icon from "../ui/Icon";

export default function ShopCard({ shop }) {
    const isClosed = shop.isOpen === false;

    return (
        <Link
            to={`/shop/${shop.id}`}
            className="card spring-card"
            style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                color: "inherit",
                textDecoration: "none",
                position: "relative",
            }}
        >
            <div style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--color-bg-subtle)", position: "relative" }}>
                {shop.logoUrl ? (
                    <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-text-muted)",
                            fontSize: 12,
                        }}
                    >
                        <Icon name="store" size={32} color="var(--color-border)" />
                        <span>ร้านค้า</span>
                    </div>
                )}

                <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
                    <StatusBadge status={!isClosed} size="sm" />
                </div>
            </div>

            <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "clamp(14px, 4vw, 16px)", fontWeight: 600, lineHeight: 1.3 }}>
                        {shop.name}
                    </h3>
                    {shop.slogan && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13,
                                color: "var(--color-text-muted)",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {shop.slogan}
                        </p>
                    )}
                </div>

                {shop.category && (
                    <div style={{ marginTop: 8 }}>
                        <span
                            style={{
                                display: "inline-block",
                                fontSize: 11,
                                fontWeight: 500,
                                background: "var(--color-primary-bg)",
                                color: "var(--color-primary-hover)",
                                padding: "2px 8px",
                                borderRadius: 9999,
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            {shop.category}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}
