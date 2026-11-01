// src/components/shop/ProductCard.jsx — With In-Stock / Out-of-Stock Support
import React from "react";
import { formatCurrency } from "../../utils/formatCurrency";
import Icon from "../ui/Icon";

export default function ProductCard({ product, onAdd, disabled }) {
    const isOutOfStock = product.isAvailable === false;
    const canAdd = !disabled && !isOutOfStock;

    return (
        <div
            className="card spring-card"
            style={{
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                opacity: isOutOfStock ? 0.75 : 1,
            }}
        >
            <div style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--color-bg-subtle)", position: "relative" }}>
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: isOutOfStock ? "grayscale(80%)" : "none",
                        }}
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
                        <Icon name="box" size={28} color="var(--color-border)" />
                        <span>ไม่มีรูปสินค้า</span>
                    </div>
                )}

                {/* Badge สินค้าหมด */}
                {isOutOfStock && (
                    <div
                        style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "rgba(15, 23, 42, 0.82)",
                            backdropFilter: "blur(4px)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "var(--radius-sm)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <span className="pulse-dot" style={{ background: "#f59e0b" }} />
                        สินค้าหมด
                    </div>
                )}
            </div>

            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "clamp(13px, 3.5vw, 15px)", lineHeight: 1.3 }}>
                        {product.name}
                    </h4>
                    {product.desc && (
                        <p
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: 12,
                                color: "var(--color-text-muted)",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {product.desc}
                        </p>
                    )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 6, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "clamp(13px, 3.5vw, 15px)", color: isOutOfStock ? "var(--color-text-muted)" : "var(--color-primary)" }}>
                        {formatCurrency(product.price)}
                    </strong>

                    <button
                        type="button"
                        onClick={() => canAdd && onAdd(product)}
                        disabled={!canAdd}
                        style={{
                            padding: "6px 10px",
                            fontSize: 12,
                            borderRadius: "var(--radius-sm)",
                            minHeight: 34,
                            cursor: canAdd ? "pointer" : "not-allowed",
                            background: isOutOfStock ? "var(--color-bg-subtle)" : undefined,
                            color: isOutOfStock ? "var(--color-text-muted)" : undefined,
                            borderColor: isOutOfStock ? "var(--color-border)" : undefined,
                        }}
                        aria-label={isOutOfStock ? `${product.name} สินค้าหมด` : `เพิ่ม ${product.name} ลงตะกร้า`}
                    >
                        {isOutOfStock ? (
                            "สินค้าหมด"
                        ) : (
                            <>
                                <Icon name="plus" size={14} /> เพิ่ม
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
