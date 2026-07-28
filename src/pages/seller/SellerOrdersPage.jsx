// src/pages/seller/SellerOrdersPage.jsx — อัปเดต: สถานะออเดอร์ (รอยืนยัน/กำลังทำ/เสร็จแล้ว/ยกเลิก)
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopsByOwner, getOrdersByShop } from "../../firebase/firestore";
import { formatCurrency } from "../../utils/formatCurrency";

const ORDER_STATUS_LABEL = {
    pending: { text: "รอยืนยัน", color: "var(--color-status-pending)", bg: "var(--color-status-pending-bg)" },
    preparing: { text: "กำลังทำ", color: "var(--color-primary)", bg: "var(--color-primary-bg)" },
    completed: { text: "เสร็จแล้ว", color: "var(--color-status-approved)", bg: "var(--color-status-approved-bg)" },
    cancelled: { text: "ยกเลิก", color: "var(--color-status-rejected)", bg: "var(--color-status-rejected-bg)" },
};

// ปุ่ม "ขั้นตอนถัดไป" ที่ทำได้จากสถานะปัจจุบัน (ทำให้ seller กดตามลำดับที่ควรเป็น ไม่กดมั่ว)
const NEXT_ACTIONS = {
    pending: [{ status: "preparing", label: "รับออเดอร์ / เริ่มทำ" }, { status: "cancelled", label: "ยกเลิกออเดอร์" }],
    preparing: [{ status: "completed", label: "ทำเสร็จแล้ว" }, { status: "cancelled", label: "ยกเลิกออเดอร์" }],
    completed: [],
    cancelled: [],
};

export default function SellerOrdersPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        load();
    }, [user]);

    async function load() {
        setLoading(true);
        const shops = await getShopsByOwner(user.uid);
        const myShop = shops[0] || null;
        setShop(myShop);
        if (myShop) {
            const ordersData = await getOrdersByShop(myShop.id);
            setOrders(ordersData);
        }
        setLoading(false);
    }

    async function handleStatusChange(orderId, status) {
        setBusyId(orderId);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/updateOrderStatus", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ shopId: shop.id, orderId, status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
            showToast("อัปเดตสถานะออเดอร์แล้ว", "success");
            await load();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setBusyId(null);
        }
    }

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
            <h2>ออเดอร์ — {shop.name}</h2>

            {orders.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>ยังไม่มีออเดอร์เข้ามา</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {orders.map((order) => {
                        const statusInfo = ORDER_STATUS_LABEL[order.status || "pending"];
                        const actions = NEXT_ACTIONS[order.status || "pending"];
                        return (
                            <div key={order.id} className="card" style={{ padding: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong>{order.customerName}</strong>
                                    <span className={`status-badge status-badge--${order.status === "completed" ? "approved" : order.status === "cancelled" ? "rejected" : "pending"}`}>
                                        {statusInfo.text}
                                    </span>
                                </div>
                                <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                                    ติดต่อ: {order.customerContact}
                                </p>
                                <ul style={{ margin: "0 0 8px 0", paddingLeft: 18, fontSize: 13 }}>
                                    {order.items?.map((item, i) => (
                                        <li key={i}>
                                            {item.name} x{item.qty}
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong>{formatCurrency(order.total)}</strong>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {actions.map((action) => (
                                            <button
                                                key={action.status}
                                                disabled={busyId === order.id}
                                                onClick={() => handleStatusChange(order.id, action.status)}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}