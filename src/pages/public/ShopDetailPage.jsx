// src/pages/public/ShopDetailPage.jsx — อัปเดต Mobile-First + Zero-Emoji + Vector Iconography
import React, { useEffect, useState } from "react";
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
import StatusBadge from "../../components/ui/StatusBadge";

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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))", gap: 12 }}>
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

    async function handleConfirmOrder({ customerName, customerContact, slipUrl, clientOrderId }) {
        const response = await fetch("/api/createOrder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                shopId,
                items: cartItems.map(({ product, qty }) => ({ productId: product.id, qty })),
                customerName,
                customerContact,
                slipUrl,
                clientOrderId,
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

            {/* Shop Header Banner */}
            <div
                className="card"
                style={{
                    padding: "16px 20px",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 20,
                    flexWrap: "wrap",
                }}
            >
                {shop.logoUrl ? (
                    <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        style={{ width: 72, height: 72, borderRadius: "var(--radius-md)", objectFit: "cover", flexShrink: 0 }}
                    />
                ) : (
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: "var(--radius-md)",
                            background: "var(--color-bg-subtle)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon name="store" size={32} color="var(--color-border)" />
                    </div>
                )}

                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                        <h1 style={{ margin: 0, fontSize: "clamp(18px, 5vw, 24px)" }}>{shop.name}</h1>
                        <StatusBadge status={!isClosed} />
                    </div>

                    {shop.slogan && <p style={{ margin: "0 0 6px 0", color: "var(--color-text-muted)", fontSize: 14 }}>{shop.slogan}</p>}

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13, color: "var(--color-text-muted)" }}>
                        {shop.phone && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Icon name="phone" size={13} /> {shop.phone}
                            </span>
                        )}
                        {shop.ig && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Icon name="instagram" size={13} /> @{shop.ig}
                            </span>
                        )}
                        {shop.category && (
                            <span
                                style={{
                                    fontSize: 11,
                                    background: "var(--color-primary-bg)",
                                    color: "var(--color-primary)",
                                    padding: "2px 8px",
                                    borderRadius: 9999,
                                }}
                            >
                                {shop.category}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isClosed && (
                <div
                    className="card"
                    style={{
                        padding: "12px 16px",
                        marginBottom: 16,
                        background: "#fffbeb",
                        borderColor: "#fde68a",
                        color: "#92400e",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 14,
                    }}
                >
                    <Icon name="pause" size={18} color="#b45309" />
                    <span>ร้านนี้ปิดรับออเดอร์ชั่วคราว ยังดูสินค้าได้ตามปกติ แต่ไม่สามารถกดสั่งซื้อได้ในขณะนี้</span>
                </div>
            )}

            <div className="shop-detail-layout">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
                        gap: 12,
                        alignContent: "start",
                    }}
                >
                    {products.length === 0 ? (
                        <div
                            className="card"
                            style={{
                                gridColumn: "1 / -1",
                                padding: "40px 16px",
                                textAlign: "center",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <Icon name="box" size={36} color="var(--color-border)" />
                            <p style={{ margin: 0 }}>ร้านนี้ยังไม่มีสินค้าวางจำหน่าย</p>
                        </div>
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
