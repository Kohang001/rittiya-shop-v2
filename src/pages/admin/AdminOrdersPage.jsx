// src/pages/admin/AdminOrdersPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAllOrdersForAdmin } from "../../hooks/useOrders";
import { useAllShopsForAdmin } from "../../hooks/useShops";
import Breadcrumb from "../../components/ui/Breadcrumb";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";
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

    // ทำ map shopId -> shopName ไว้เพื่อไม่ต้อง query ซ้ำต่อออเดอร์
    const shopNameById = useMemo(() => {
        const map = {};
        shops.forEach((s) => (map[s.id] = s.name));
        return map;
    }, [shops]);

    const filteredOrders = useMemo(() => {
        if (!searchShop.trim()) return orders;
        return orders.filter((o) =>
            (shopNameById[o.shopId] || "").toLowerCase().includes(searchShop.toLowerCase())
        );
    }, [orders, searchShop, shopNameById]);

    const loading = ordersLoading || shopsLoading;

    return (
        <div>
            <AdminNav />
            <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
                <Breadcrumb items={[{ label: "รายชื่อร้าน", to: "/admin/shops" }, { label: "ออเดอร์ทั้งหมด" }]} />

                <h2>ออเดอร์ทั้งหมด ({orders.length})</h2>

                <input
                    type="text"
                    placeholder="ค้นหาชื่อร้าน..."
                    value={searchShop}
                    onChange={(e) => setSearchShop(e.target.value)}
                    style={{ width: "100%", marginBottom: 16 }}
                />

                {loading ? (
                    <PageSkeleton lines={5} />
                ) : filteredOrders.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)" }}>ไม่พบออเดอร์</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="card" style={{ padding: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <Link to={`/admin/shops/${order.shopId}`} style={{ fontWeight: 600 }}>
                                        {shopNameById[order.shopId] || "ร้านที่ถูกลบไปแล้ว"}
                                    </Link>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                                <div style={{ margin: "4px 0" }}>
                                    <span className={`status-badge status-badge--${ORDER_STATUS_LABEL[order.status || "pending"].cls}`}>
                                        {ORDER_STATUS_LABEL[order.status || "pending"].text}
                                    </span>
                                </div>
                                <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                                    {order.customerName} · {order.customerContact}
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
        </div>
    );
}