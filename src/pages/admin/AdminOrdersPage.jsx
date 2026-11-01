// src/pages/admin/AdminOrdersPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAllOrdersForAdmin } from "../../hooks/useOrders";
import { useAllShopsForAdmin } from "../../hooks/useShops";
import Breadcrumb from "../../components/ui/Breadcrumb";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";
import { formatCurrency } from "../../utils/formatCurrency";

const ORDER_STATUS_LABEL = {
    pending: { text: "รอชำระเงิน", cls: "pending" },
    slip_uploaded: { text: "ส่งสลิปแล้ว", cls: "pending" },
    preparing: { text: "กำลังทำ", cls: "pending" },
    completed: { text: "เสร็จแล้ว", cls: "approved" },
    cancelled: { text: "ยกเลิก", cls: "rejected" },
};

export default function AdminOrdersPage() {
    const { orders, loading: ordersLoading } = useAllOrdersForAdmin();
    const { shops, loading: shopsLoading } = useAllShopsForAdmin();
    const [searchShop, setSearchShop] = useState("");

    const shopNameById = useMemo(() => {
        const map = {};
        shops.forEach((s) => (map[s.id] = s.name));
        return map;
    }, [shops]);

    const filteredOrders = useMemo(() => {
        if (!searchShop.trim()) return orders;
        const q = searchShop.toLowerCase().trim();
        return orders.filter(
            (o) =>
                (shopNameById[o.shopId] || "").toLowerCase().includes(q) ||
                o.customerName?.toLowerCase().includes(q) ||
                o.customerContact?.includes(q)
        );
    }, [orders, searchShop, shopNameById]);

    const loading = ordersLoading || shopsLoading;

    return (
        <div>
            <AdminNav />
            <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
                <Breadcrumb items={[{ label: "ภาพรวม", to: "/admin" }, { label: "ออเดอร์ทั้งหมด" }]} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 26px)", fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                            ออเดอร์ทั้งหมดในระบบ ({orders.length})
                        </h1>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)" }}>
                            ติดตามคำสั่งซื้อ ตรวจสอบยอดชำระ และสถานะออเดอร์ข้ามทุกร้าน
                        </p>
                    </div>
                </div>

                <div style={{ position: "relative", marginBottom: 20 }}>
                    <input
                        type="search"
                        placeholder="ค้นหาชื่อร้าน, ชื่อลูกค้า, หรือเบอร์ติดต่อ..."
                        value={searchShop}
                        onChange={(e) => setSearchShop(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "9px 12px 9px 36px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-border)",
                            fontSize: 13,
                            background: "var(--color-bg-surface)",
                        }}
                    />
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <Icon name="search" size={15} color="var(--color-text-muted)" />
                    </div>
                </div>

                {loading ? (
                    <PageSkeleton lines={5} />
                ) : filteredOrders.length === 0 ? (
                    <div
                        style={{
                            padding: "48px 16px",
                            textAlign: "center",
                            border: "1px dashed var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            background: "var(--color-bg-subtle)",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        <Icon name="receipt" size={36} color="var(--color-text-muted)" />
                        <p style={{ margin: "10px 0 0 0", fontSize: 15, fontWeight: 500 }}>
                            ไม่พบรายการคำสั่งซื้อ
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="card"
                                style={{
                                    padding: 16,
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg-surface)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)" }}>
                                            #{order.id.slice(0, 7).toUpperCase()}
                                        </span>
                                        <Link
                                            to={`/admin/shops/${order.shopId}`}
                                            style={{
                                                fontWeight: 600,
                                                fontSize: 15,
                                                color: "var(--color-primary)",
                                                textDecoration: "none",
                                            }}
                                        >
                                            {shopNameById[order.shopId] || "ร้านค้า"}
                                        </Link>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: 16, color: "var(--color-primary)" }}>
                                        {formatCurrency(order.total || order.totalPrice)}
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 10px 0" }}>
                                    <span className={`status-badge status-badge--${ORDER_STATUS_LABEL[order.status || "pending"].cls}`}>
                                        {ORDER_STATUS_LABEL[order.status || "pending"].text}
                                    </span>
                                    <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                                        ลูกค้า: <strong style={{ color: "var(--color-text)" }}>{order.customerName}</strong> ({order.customerContact})
                                    </span>
                                </div>

                                <div style={{ padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
                                        รายการสินค้าที่สั่ง:
                                    </span>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                                        {order.items?.map((item, i) => (
                                            <li key={i}>
                                                {item.name} x{item.qty} {item.price ? `(${formatCurrency(item.price * item.qty)})` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
