// src/pages/seller/SellerOrdersPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getShopsByOwner, getOrdersByShop } from "../../firebase/firestore";

export default function SellerOrdersPage() {
    const { user } = useAuth();
    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const shops = await getShopsByOwner(user.uid);
            const myShop = shops[0] || null;
            setShop(myShop);
            if (myShop) {
                const ordersData = await getOrdersByShop(myShop.id);
                setOrders(ordersData);
            }
            setLoading(false);
        }
        load();
    }, [user]);

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
            <h2>ออเดอร์ — {shop.name}</h2>

            {orders.length === 0 ? (
                <p style={{ color: "#888" }}>
                    ยังไม่มีออเดอร์เข้ามา (ระบบสั่งซื้อจริงจะเชื่อมต่อใน Phase 6)
                </p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {orders.map((order) => (
                        <div key={order.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <strong>{order.customerName}</strong>
                                <span>{order.total?.toLocaleString()} บาท</span>
                            </div>
                            <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
                                ติดต่อ: {order.customerContact}
                            </p>
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                                {order.items?.map((item, i) => (
                                    <li key={i}>
                                        {item.name} x{item.qty}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}