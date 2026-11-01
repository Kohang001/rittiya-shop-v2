// src/components/shop/QuantityInput.jsx
import React from "react";
import Icon from "../ui/Icon";

/**
 * ปุ่ม +/- ปรับจำนวนสินค้า ใช้ซ้ำได้ทั้งใน CartSummary และที่อื่น
 * ขนาดปุ่มเป็นไปตาม .qty-btn ใน index.css (Touch Target แตะง่ายบนมือถือ)
 */
export default function QuantityInput({ qty, onChange, min = 0, label = "" }) {
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button
                type="button"
                className="qty-btn"
                aria-label={`ลดจำนวน${label ? " " + label : ""}`}
                onClick={() => onChange(Math.max(min, qty - 1))}
                style={{
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-sm)",
                }}
            >
                <Icon name="minus" size={12} />
            </button>
            <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, fontSize: 13 }}>{qty}</span>
            <button
                type="button"
                className="qty-btn"
                aria-label={`เพิ่มจำนวน${label ? " " + label : ""}`}
                onClick={() => onChange(qty + 1)}
                style={{
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-sm)",
                }}
            >
                <Icon name="plus" size={12} />
            </button>
        </div>
    );
}
