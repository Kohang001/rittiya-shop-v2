// src/pages/public/ShopDetailPage.jsx — อัปเดต Phase 6: เรียก /api/createOrder จริง
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getShopById, getApprovedProducts } from "../../firebase/firestore";
import { useCart } from "../../context/CartContext";
import ProductCard from "../../components/shop/ProductCard";
import CartSummary from "../../components/shop/CartSummary";

export default function ShopDetailPage() {
    const { shopId } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const { addItem, setQty, getCartItems, getTotal, clearCart } = useCart();

    useEffect(() => {
        Promise.all([getShopById(shopId), getApprovedProducts(shopId)])
            .then(([shopData, productsData]) => {
                setShop(shopData);
                setProducts(productsData);
            })
            .catch((err) => console.error("โหลดข้อมูลร้านไม่สำเร็จ:", err))
            .finally(() => setLoading(false));
    }, [shopId]);

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้านี้</p>;

    const cartItems = getCartItems(shopId);
    const total = getTotal(shopId);

    async function handleCheckout() {
        const customerName = prompt("ชื่อผู้สั่งซื้อ:");
        if (!customerName) return;
        const customerContact = prompt("เบอร์โทรหรือไอจีติดต่อกลับ:");
        if (!customerContact) return;

        setPlacingOrder(true);
        try {
            const response = await fetch("/api/createOrder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId,
                    items: cartItems.map(({ product, qty }) => ({
                        productId: product.id,
                        qty,
                    })),
                    customerName,
                    customerContact,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "สั่งซื้อไม่สำเร็จ");
                return;
            }

            alert(`สั่งซื้อสำเร็จ! ยอดรวม ${data.total.toLocaleString()} บาท`);
            clearCart(shopId);
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setPlacingOrder(false);
        }
    }

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                {shop.logoUrl && (
                    <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover" }}
                    />
                )}
                <div>
                    <h1 style={{ margin: 0 }}>{shop.name}</h1>
                    <p style={{ margin: 0, color: "#666" }}>{shop.slogan}</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                        📞 {shop.phone} {shop.ig && `· IG: @${shop.ig}`}
                    </p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: 12,
                        alignContent: "start",
                    }}
                >
                    {products.length === 0 ? (
                        <p style={{ color: "#888" }}>ร้านนี้ยังไม่มีสินค้า</p>
                    ) : (
                        products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAdd={(p) => addItem(shopId, p)}
                            />
                        ))
                    )}
                </div>

                <div>
                    <CartSummary
                        items={cartItems}
                        total={total}
                        onQtyChange={(productId, qty) => setQty(shopId, productId, qty)}
                        onCheckout={handleCheckout}
                        checkoutDisabled={placingOrder}
                    />
                </div>
            </div>
        </div>
    );
}