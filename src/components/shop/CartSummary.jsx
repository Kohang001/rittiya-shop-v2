// src/components/shop/CartSummary.jsx — อัปเดต Phase 6: เพิ่ม checkoutDisabled
export default function CartSummary({ items, total, onQtyChange, onCheckout, checkoutDisabled }) {
    if (items.length === 0) {
        return (
            <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
                <p style={{ color: "#888", margin: 0 }}>ยังไม่มีสินค้าในตะกร้า</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
            <h3 style={{ marginTop: 0 }}>ตะกร้าสินค้า</h3>
            {items.map(({ product, qty }) => (
                <div
                    key={product.id}
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <span style={{ fontSize: 14 }}>{product.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => onQtyChange(product.id, qty - 1)}>-</button>
                        <span>{qty}</span>
                        <button onClick={() => onQtyChange(product.id, qty + 1)}>+</button>
                    </div>
                </div>
            ))}
            <hr />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>รวม</span>
                <span>{total.toLocaleString()} บาท</span>
            </div>
            <button
                onClick={onCheckout}
                disabled={checkoutDisabled}
                style={{ width: "100%", marginTop: 12, padding: 10 }}
            >
                {checkoutDisabled ? "กำลังสั่งซื้อ..." : "สั่งซื้อ"}
            </button>
        </div>
    );
}