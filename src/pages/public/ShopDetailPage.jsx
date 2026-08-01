// src/pages/public/ShopDetailPage.jsx — อัปเดต: เช็คร้านปิดชั่วคราว + ส่ง promptpayTarget ให้ CheckoutModal
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getShopById, getApprovedProducts } from "../../firebase/firestore";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import ProductCard from "../../components/shop/ProductCard";
import ProductCardSkeleton from "../../components/shop/ProductCardSkeleton";
import CartSummary from "../../components/shop/CartSummary";
import CheckoutModal from "../../components/shop/CheckoutModal";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Icon from "../../components/ui/Icon";

export default function ShopDetailPage() {
    const { shopId } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCheckout, setShowCheckout] = useState(false);
    const { addItem, setQty, getCartItems, getTotal, clearCart } = useCart();
    const { showToast } = useToast();

    useEffect(() => {
        Promise.all([getShopById(shopId), getApprovedProducts(shopId)])
            .then(([shopData, productsData]) => {
                setShop(shopData);
                setProducts(productsData);
            })
            .catch((err) => {
                console.error("โหลดข้อมูลร้านไม่สำเร็จ:", err);
                showToast("โหลดข้อมูลร้านไม่สำเร็จ", "error");
            })
            .finally(() => setLoading(false));
    }, [shopId]);

    if (loading) {
        return (
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
                <div className="shop-detail-layout">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                    <div />
                </div>
            </div>
        );
    }

    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้านี้</p>;

    const isClosed = shop.isOpen === false;
    const paymentInfo = {
        promptpayId: shop.promptpayId || null,
        bankName: shop.bankName || null,
        bankAccountNumber: shop.bankAccountNumber || null,
        bankAccountName: shop.bankAccountName || null,
    };
    const cartItems = getCartItems(shopId);
    const total = getTotal(shopId);

    function handleAddToCart(product) {
        addItem(shopId, product);
        showToast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, "success");
    }

    async function handleConfirmOrder({ customerName, customerContact, slipUrl }) {
        const response = await fetch("/api/createOrder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                shopId,
                items: cartItems.map(({ product, qty }) => ({ productId: product.id, qty })),
                customerName,
                customerContact,
                slipUrl,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "สั่งซื้อไม่สำเร็จ");
        }

        clearCart(shopId);
        return data;
    }

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
            <Breadcrumb items={[{ label: "ร้านค้า", to: "/" }, { label: shop.name }]} />

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
                    <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{shop.slogan}</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="phone" size={14} /> {shop.phone}
                        {shop.ig && (
                            <>
                                <Icon name="instagram" size={14} style={{ marginLeft: 10 }} /> @{shop.ig}
                            </>
                        )}
                    </p>
                </div>
            </div>

            {isClosed && (
                <div
                    className="card"
                    style={{
                        padding: 12,
                        marginBottom: 16,
                        background: "var(--color-status-pending-bg)",
                        color: "var(--color-status-pending)",
                        textAlign: "center",
                        fontSize: 14,
                    }}
                >
                    ร้านนี้ปิดรับออเดอร์ชั่วคราว ยังดูสินค้าได้ตามปกติ แต่สั่งซื้อไม่ได้ตอนนี้
                </div>
            )}

            <div className="shop-detail-layout">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: 12,
                        alignContent: "start",
                    }}
                >
                    {products.length === 0 ? (
                        <p style={{ color: "var(--color-text-muted)" }}>ร้านนี้ยังไม่มีสินค้า</p>
                    ) : (
                        products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAdd={handleAddToCart}
                                disabled={isClosed}
                            />
                        ))
                    )}
                </div>

                <div>
                    <CartSummary
                        items={cartItems}
                        total={total}
                        onQtyChange={(productId, qty) => setQty(shopId, productId, qty)}
                        onCheckout={() => setShowCheckout(true)}
                        checkoutDisabled={isClosed}
                    />
                </div>
            </div>

            {showCheckout && (
                <CheckoutModal
                    shopId={shopId}
                    items={cartItems}
                    total={total}
                    paymentInfo={paymentInfo}
                    onConfirm={handleConfirmOrder}
                    onClose={() => setShowCheckout(false)}
                />
            )}
        </div>
    );
}