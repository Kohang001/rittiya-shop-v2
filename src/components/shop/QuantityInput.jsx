// src/components/shop/QuantityInput.jsx
/**
 * ปุ่ม +/- ปรับจำนวนสินค้า ใช้ซ้ำได้ทั้งใน CartSummary และที่อื่นในอนาคต
 * ขนาดปุ่มเป็นไปตาม .qty-btn ใน index.css (แตะง่ายบนมือถือ)
 */
export default function QuantityInput({ qty, onChange, min = 0, label = "" }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
                type="button"
                className="qty-btn"
                aria-label={`ลดจำนวน${label ? " " + label : ""}`}
                onClick={() => onChange(Math.max(min, qty - 1))}
            >
                -
            </button>
            <span style={{ minWidth: 20, textAlign: "center" }}>{qty}</span>
            <button
                type="button"
                className="qty-btn"
                aria-label={`เพิ่มจำนวน${label ? " " + label : ""}`}
                onClick={() => onChange(qty + 1)}
            >
                +
            </button>
        </div>
    );
}