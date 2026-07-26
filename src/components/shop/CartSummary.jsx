// src/components/shop/CartSummary.jsx — อัปเดต: ปุ่ม +/- ขนาดแตะง่ายขึ้นบนมือถือ (WCAG/HIG)
import Icon from "../ui/Icon";

export default function CartSummary({ items, total, onQtyChange, onCheckout, checkoutDisabled }) {
    if (items.length === 0) {
        return (
            <div className="card" style={{ padding: 16 }}>
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>ยังไม่มีสินค้าในตะกร้า</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="shopping-cart" size={18} /> ตะกร้าสินค้า
            </h3>
            {items.map(({ product, qty }) => (
                <div
                    key={product.id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
                >
                    <span style={{ fontSize: 14 }}>{product.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                            type="button"
                            className="qty-btn"
                            aria-label={`ลดจำนวน ${product.name}`}
                            onClick={() => onQtyChange(product.id, qty - 1)}
                        >
                            -
                        </button>
                        <span>{qty}</span>
                        <button
                            type="button"
                            className="qty-btn"
                            aria-label={`เพิ่มจำนวน ${product.name}`}
                            onClick={() => onQtyChange(product.id, qty + 1)}
                        >
                            +
                        </button>
                    </div>
                </div>
            ))}
            <hr style={{ borderColor: "var(--color-border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>รวม</span>
                <span>{total.toLocaleString()} บาท</span>
            </div>
            <button
                type="submit"
                onClick={onCheckout}
                disabled={checkoutDisabled}
                style={{ width: "100%", marginTop: 12, padding: 10, justifyContent: "center" }}
            >
                {checkoutDisabled ? "กำลังสั่งซื้อ..." : "สั่งซื้อ"}
            </button>
        </div>
    );
}