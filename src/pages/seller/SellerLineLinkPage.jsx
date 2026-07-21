// src/pages/seller/SellerLineLinkPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getShopsByOwner } from "../../firebase/firestore";

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

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
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
                    style={{
                        border: "2px dashed #333",
                        borderRadius: 12,
                        padding: 20,
                    }}
                >
                    <p style={{ marginBottom: 8 }}>
                        ยังไม่ได้เชื่อมต่อ LINE — เพิ่มเพื่อน LINE Official Account ของเรา
                        แล้วพิมพ์รหัสนี้ส่งไปในแชท:
                    </p>
                    <p style={{ fontSize: 32, fontWeight: "bold", letterSpacing: 4 }}>
                        {shop.lineLinkCode}
                    </p>
                    <p style={{ fontSize: 12, color: "#888" }}>
                        (ระบบเชื่อมต่ออัตโนมัติจะทำงานจริงใน Phase 7)
                    </p>
                </div>
            )}
        </div>
    );
}