// src/pages/seller/SellerOrdersPage.jsx — With Status Filter Tabs + CSV Export
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopsByOwner, getOrdersByShop } from "../../firebase/firestore";
import { formatCurrency } from "../../utils/formatCurrency";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";

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
    const [activeTab, setActiveTab] = useState("all"); // "all" | "slip_uploaded" | "preparing" | "completed" | "cancelled"

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

    // กรองออเดอร์ตามแท็บ
    const filteredOrders = useMemo(() => {
        if (activeTab === "all") return orders;
        return orders.filter((o) => (o.status || "pending") === activeTab);
    }, [orders, activeTab]);

    // ส่งออกรายงานออเดอร์เป็น CSV (Excel-compatible with UTF-8 BOM)
    function handleExportCSV() {
        if (orders.length === 0) {
            showToast("ไม่มีข้อมูลออเดอร์ให้ส่งออก", "error");
            return;
        }

        const headers = ["รหัสออเดอร์", "วันที่สั่ง", "ชื่อลูกค้า", "เบอร์/ช่องทางติดต่อ", "รายการสินค้า", "ยอดรวม (บาท)", "สถานะ", "ลิงก์สลิป"];
        const rows = orders.map((o) => {
            const dateStr = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString("th-TH") : "";
            const itemsStr = (o.items || []).map((i) => `${i.name} x${i.qty}`).join("; ");
            const statusText = ORDER_STATUS_LABEL[o.status]?.text || o.status;
            return [
                `#${o.id}`,
                `"${dateStr}"`,
                `"${(o.customerName || "").replace(/"/g, '""')}"`,
                `"${(o.customerContact || "").replace(/"/g, '""')}"`,
                `"${itemsStr.replace(/"/g, '""')}"`,
                o.total || 0,
                `"${statusText}"`,
                `"${o.slipUrl || ""}"`,
            ].join(",");
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `orders_${shop?.name || "shop"}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("ดาวน์โหลดไฟล์รายงาน CSV สำเร็จ", "success");
    }

    if (loading) return <PageSkeleton lines={5} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    const slipUploadedCount = orders.filter((o) => o.status === "slip_uploaded").length;
    const preparingCount = orders.filter((o) => o.status === "preparing").length;

    return (
        <div style={{ maxWidth: 740, margin: "40px auto", padding: "0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0" }}>ออเดอร์ — {shop.name} ({orders.length})</h2>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
                        ตรวจสอบสลิปโอนเงิน ยืนยันคำสั่งซื้อ และจัดการสถานะสินค้า
                    </p>
                </div>

                {orders.length > 0 && (
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-bg-surface)",
                            border: "1px solid var(--color-border)",
                            cursor: "pointer",
                        }}
                    >
                        <Icon name="upload" size={13} style={{ transform: "rotate(180deg)" }} />
                        ส่งออก CSV (Excel)
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            <div
                style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: 20,
                    paddingBottom: 12,
                    borderBottom: "1px solid var(--color-border)",
                }}
            >
                {[
                    { id: "all", label: "ทั้งหมด", count: orders.length },
                    { id: "slip_uploaded", label: "รอตรวจสลิป", count: slipUploadedCount, alert: slipUploadedCount > 0 },
                    { id: "preparing", label: "กำลังทำ", count: preparingCount },
                    { id: "completed", label: "เสร็จแล้ว", count: orders.filter((o) => o.status === "completed").length },
                    { id: "cancelled", label: "ยกเลิก", count: orders.filter((o) => o.status === "cancelled").length },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: isActive ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                background: isActive ? "var(--color-primary)" : "var(--color-bg-surface)",
                                color: isActive ? "#ffffff" : tab.alert ? "var(--color-danger)" : "var(--color-text)",
                                fontSize: 12,
                                fontWeight: isActive ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <span>{tab.label}</span>
                            <span
                                style={{
                                    fontSize: 11,
                                    padding: "1px 6px",
                                    borderRadius: 10,
                                    background: isActive
                                        ? "rgba(255, 255, 255, 0.25)"
                                        : tab.alert
                                        ? "var(--color-status-rejected-bg)"
                                        : "var(--color-bg-subtle)",
                                    color: isActive ? "#ffffff" : tab.alert ? "var(--color-danger)" : "var(--color-text-muted)",
                                    fontWeight: 600,
                                }}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {filteredOrders.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--color-text-muted)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)" }}>
                    <Icon name="receipt" size={32} color="var(--color-text-muted)" />
                    <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>ไม่พบออเดอร์ในสถานะนี้</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredOrders.map((order) => {
                        const statusKey = order.status || "pending";
                        const statusInfo = ORDER_STATUS_LABEL[statusKey] || { text: statusKey, cls: "pending" };
                        const actions = NEXT_ACTIONS[statusKey] || [];
                        const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString("th-TH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

                        return (
                            <div
                                key={order.id}
                                className="card"
                                style={{
                                    padding: 16,
                                    borderRadius: "var(--radius-md)",
                                    border: statusKey === "slip_uploaded" ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <strong>{order.customerName}</strong>
                                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>#{order.id.slice(0, 7).toUpperCase()}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        {dateStr && <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{dateStr}</span>}
                                        <span className={`status-badge status-badge--${statusInfo.cls}`}>{statusInfo.text}</span>
                                    </div>
                                </div>

                                <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                                    ช่องทางติดต่อ: <strong>{order.customerContact}</strong>
                                </p>

                                <div style={{ padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", marginBottom: 12 }}>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                                        {order.items?.map((item, i) => (
                                            <li key={i} style={{ margin: "2px 0" }}>
                                                {item.name} x{item.qty} — <span style={{ color: "var(--color-text-muted)" }}>{formatCurrency(item.price * item.qty)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {order.slipUrl && (
                                    <div style={{ marginBottom: 12 }}>
                                        <p style={{ margin: "0 0 6px 0", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>
                                            หลักฐานการโอนเงิน (คลิกเพื่อดูรูปขยาย):
                                        </p>
                                        <a href={order.slipUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block" }}>
                                            <img
                                                src={order.slipUrl}
                                                alt="สลิปการโอนเงิน"
                                                style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                                            />
                                        </a>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                                    <div>
                                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>ยอดรวมทั้งสิ้น: </span>
                                        <strong style={{ fontSize: 18, color: "var(--color-primary)" }}>{formatCurrency(order.total)}</strong>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {actions.map((action) => (
                                            <button
                                                key={action.status}
                                                disabled={busyId === order.id}
                                                onClick={() => handleStatusChange(order.id, action.status)}
                                                style={{
                                                    minHeight: 36,
                                                    fontSize: 13,
                                                    padding: "6px 14px",
                                                    borderRadius: "var(--radius-sm)",
                                                    fontWeight: 500,
                                                    cursor: busyId === order.id ? "not-allowed" : "pointer",
                                                    background: action.status === "cancelled" ? "var(--color-status-rejected-bg)" : "var(--color-primary)",
                                                    color: action.status === "cancelled" ? "var(--color-danger)" : "#ffffff",
                                                    border: action.status === "cancelled" ? "1px solid rgba(239, 68, 68, 0.2)" : "none",
                                                }}
                                            >
                                                {busyId === order.id ? "กำลังบันทึก..." : action.label}
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
