// src/pages/seller/SellerOrdersPage.jsx — อัปเดต: เพิ่มสถานะ slip_uploaded + โชว์รูปสลิป
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopsByOwner, getOrdersByShop } from "../../firebase/firestore";
import { formatCurrency } from "../../utils/formatCurrency";

import PageSkeleton from "../../components/ui/PageSkeleton";

const ORDER_STATUS_LABEL = {
    pending: { text: "รอชำระเงิน", cls: "pending" },
    slip_uploaded: { text: "ส่งสลิปแล้ว รอตรวจสอบ", cls: "pending" },
    preparing: { text: "กำลังทำ", cls: "pending" },
    completed: { text: "เสร็จแล้ว", cls: "approved" },
    cancelled: { text: "ยกเลิก", cls: "rejected" },
};

const NEXT_ACTIONS = {
    pending: [{ status: "cancelled", label: "ยกเลิกออเดอร์" }],
    slip_uploaded: [
        { status: "preparing", label: "ยืนยันได้รับเงินแล้ว / เริ่มทำ" },
        { status: "cancelled", label: "สลิปไม่ถูกต้อง / ยกเลิก" },
    ],
    preparing: [
        { status: "completed", label: "ทำเสร็จแล้ว" },
        { status: "cancelled", label: "ยกเลิกออเดอร์" },
    ],
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

    if (loading) return <PageSkeleton lines={5} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
            <h2>ออเดอร์ — {shop.name}</h2>

            {orders.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>ยังไม่มีออเดอร์เข้ามา</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {orders.map((order) => {
                        const statusKey = order.status || "pending";
                        const statusInfo = ORDER_STATUS_LABEL[statusKey];
                        const actions = NEXT_ACTIONS[statusKey];
                        return (
                            <div key={order.id} className="card" style={{ padding: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong>{order.customerName}</strong>
                                    <span className={`status-badge status-badge--${statusInfo.cls}`}>{statusInfo.text}</span>
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

                                {order.slipUrl && (
                                    <a href={order.slipUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginBottom: 8 }}>
                                        <img
                                            src={order.slipUrl}
                                            alt="สลิปการโอนเงิน"
                                            style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border)" }}
                                        />
                                    </a>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong>{formatCurrency(order.total)}</strong>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {actions.map((action) => (
                                            <button key={action.status} disabled={busyId === order.id} onClick={() => handleStatusChange(order.id, action.status)}>
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