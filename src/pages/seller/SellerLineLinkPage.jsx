// src/pages/seller/SellerLineLinkPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getShopsByOwner } from "../../firebase/firestore";
import PageSkeleton from "../../components/ui/PageSkeleton";

export default function SellerLineLinkPage() {
    const { user } = useAuth();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const shops = await getShopsByOwner(user.uid);
            setShop(shops[0] || null);
            setLoading(false);
        }
        load();
    }, [user]);

    if (loading) return <PageSkeleton lines={4} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    const isConnected = Boolean(shop.lineUserId);

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px", textAlign: "center" }}>
            <h2>เชื่อมต่อ LINE</h2>

            {isConnected ? (
                <div
                    style={{
                        border: "2px solid #0a0",
                        borderRadius: 12,
                        padding: 20,
                        color: "#080",
                    }}
                >
                    <p style={{ margin: 0, fontSize: 18 }}>✅ เชื่อมต่อสำเร็จแล้ว</p>
                    <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#666" }}>
                        ร้านนี้จะได้รับแจ้งเตือนผ่าน LINE เมื่อมีออเดอร์เข้ามา
                    </p>
                </div>
            ) : (
                    <div
                        className="card"
                        style={{
                            padding: 24,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <h3 style={{ fontSize: 16, marginBottom: 12 }}>สแกน QR Code เพื่อเชื่อมต่อ LINE</h3>
                        <img
                            src="/line-qr.png"
                            alt="LINE Official Account QR Code"
                            style={{
                                width: 200,
                                height: 200,
                                objectFit: "contain",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--color-border)",
                                padding: 8,
                                background: "#fff",
                                marginBottom: 16,
                            }}
                        />
                        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 12px 0" }}>
                            เพิ่มเพื่อน LINE Official Account แล้วพิมพ์รหัสนี้ส่งไปในแชทเพื่อเชื่อมต่อ:
                        </p>
                        <div
                            style={{
                                background: "var(--color-bg-subtle)",
                                border: "1px dashed var(--color-primary)",
                                borderRadius: "var(--radius-sm)",
                                padding: "10px 20px",
                                display: "inline-block",
                            }}
                        >
                            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "var(--color-primary)" }}>
                                {shop.lineLinkCode}
                            </span>
                        </div>
                    </div>
            )}
        </div>
    );
}