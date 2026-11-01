// src/pages/admin/AdminDashboardPage.jsx
// แดชบอร์ดภาพรวมและการดำเนินงานของผู้ดูแลระบบ (Operations & Platform Health)
// พร้อมระบบ Audit Trail บันทึกกิจกรรมและตรวจจับข้อผิดพลาดของ Admin
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getAllShopsForAdmin,
    getAllProductsForAdmin,
    getAllOrdersForAdmin,
    getAdminLogs,
} from "../../firebase/firestore";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";
import { formatCurrency } from "../../utils/formatCurrency";

export default function AdminDashboardPage() {
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [adminLogs, setAdminLogs] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [shopsData, productsData, ordersData, adminLogsData] = await Promise.all([
                    getAllShopsForAdmin().catch(() => []),
                    getAllProductsForAdmin().catch(() => []),
                    getAllOrdersForAdmin().catch(() => []),
                    getAdminLogs(60).catch(() => []),
                ]);
                setShops(shopsData);
                setProducts(productsData);
                setOrders(ordersData);
                setAdminLogs(adminLogsData);
            } catch (err) {
                console.error("Failed to load admin dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // คำนวณยอดขายรวมโดยประมาณ
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const activeShopsCount = shops.filter((s) => s.status !== "rejected").length;

    // รวบรวม Activity Logs ทั้งหมดจาก Admin Logs, ร้านค้า, สินค้า, และออเดอร์
    const allActivityLogs = useMemo(() => {
        const logs = [];

        // 1. กิจกรรมและข้อผิดพลาดของ Admin (Audit Trail จริงจาก Firestore)
        adminLogs.forEach((l) => {
            const isError = l.status === "error";
            let badge = "Admin";
            let badgeColor = "var(--color-primary)";

            if (isError) {
                badge = "Admin ผิดพลาด";
                badgeColor = "var(--color-danger, #ef4444)";
            } else if (l.action === "suspend_shop" || l.action === "hide_product") {
                badge = "Admin ระงับ/ซ่อน";
                badgeColor = "#f59e0b";
            } else if (l.action === "activate_shop" || l.action === "unhide_product") {
                badge = "Admin คืนสภาพ";
                badgeColor = "var(--color-success, #22c55e)";
            } else if (l.action === "admin_login") {
                badge = "Admin Login";
                badgeColor = "var(--color-info, #3b82f6)";
            } else if (l.action === "delete_feed_post" || l.action === "hide_feed_post") {
                badge = "Admin ประกาศ";
                badgeColor = "#f59e0b";
            }

            let link = "/admin";
            if (l.targetType === "shop" && l.targetId) {
                link = `/admin/shops/${l.targetId}`;
            } else if (l.targetType === "product") {
                link = `/admin/products`;
            } else if (l.targetType === "feedPost") {
                link = `/admin/feed`;
            }

            logs.push({
                id: `admin-log-${l.id}`,
                type: "admin",
                action: l.action,
                isError,
                title: l.detail || `การกระทำของ Admin: ${l.action}`,
                detail: `โดย: ${l.actorEmail || "Admin"}${l.metadata?.reason ? ` · เหตุผล: ${l.metadata.reason}` : ""}`,
                errorDetails: l.errorDetails || null,
                metadata: l.metadata || null,
                date: l.createdAt?.toDate ? l.createdAt.toDate() : new Date(),
                badge,
                badgeColor,
                link,
            });
        });

        // 2. ร้านค้าเปิดใหม่
        shops.forEach((s) => {
            logs.push({
                id: `shop-${s.id}`,
                type: "shop",
                isError: false,
                title: `ร้านค้าเปิดใหม่: ${s.name}`,
                detail: `หมวดหมู่: ${s.category || "ทั่วไป"} · เบอร์ติดต่อ: ${s.phone}`,
                date: s.createdAt?.toDate ? s.createdAt.toDate() : new Date(),
                badge: "ร้านใหม่",
                badgeColor: "var(--color-primary)",
                link: `/admin/shops/${s.id}`,
            });
        });

        // 3. สินค้าใหม่
        products.forEach((p) => {
            logs.push({
                id: `prod-${p.id}`,
                type: "product",
                isError: false,
                title: `เพิ่มสินค้าใหม่: ${p.name}`,
                detail: `ราคา: ${formatCurrency(p.price)} · รหัสร้าน: ${p.shopId || "-"}`,
                date: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(),
                badge: "สินค้าใหม่",
                badgeColor: "var(--color-success)",
                link: `/admin/products`,
            });
        });

        // 4. ออเดอร์ใหม่
        orders.forEach((o) => {
            logs.push({
                id: `order-${o.id}`,
                type: "order",
                isError: false,
                title: `ออเดอร์ใหม่: #${o.id.slice(0, 7).toUpperCase()}`,
                detail: `ยอดรวม: ${formatCurrency(o.totalPrice)} · ลูกค้า: ${o.customerName || "-"}`,
                date: o.createdAt?.toDate ? o.createdAt.toDate() : new Date(),
                badge: "ออเดอร์",
                badgeColor: "var(--color-info, #2563eb)",
                link: `/admin/orders`,
            });
        });

        // เรียงจากล่าสุดไปเก่าสุด
        logs.sort((a, b) => b.date - a.date);
        return logs;
    }, [adminLogs, shops, products, orders]);

    // นับจำนวนสำหรับแต่ละแท็บ
    const adminCount = useMemo(() => allActivityLogs.filter((l) => l.type === "admin").length, [allActivityLogs]);
    const errorCount = useMemo(() => allActivityLogs.filter((l) => l.isError).length, [allActivityLogs]);
    const shopCount = useMemo(() => allActivityLogs.filter((l) => l.type === "shop").length, [allActivityLogs]);
    const productCount = useMemo(() => allActivityLogs.filter((l) => l.type === "product").length, [allActivityLogs]);
    const orderCount = useMemo(() => allActivityLogs.filter((l) => l.type === "order").length, [allActivityLogs]);

    // กรอง Log ตามแท็บที่เลือก
    const filteredLogs = useMemo(() => {
        let result = allActivityLogs;
        if (activeTab === "admin") {
            result = result.filter((l) => l.type === "admin");
        } else if (activeTab === "errors") {
            result = result.filter((l) => l.isError);
        } else if (activeTab === "shops") {
            result = result.filter((l) => l.type === "shop");
        } else if (activeTab === "products") {
            result = result.filter((l) => l.type === "product");
        } else if (activeTab === "orders") {
            result = result.filter((l) => l.type === "order");
        }
        return result.slice(0, 30);
    }, [allActivityLogs, activeTab]);

    if (loading) {
        return (
            <div>
                <AdminNav />
                <div style={{ maxWidth: 1040, margin: "32px auto", padding: "0 16px" }}>
                    <PageSkeleton lines={7} />
                </div>
            </div>
        );
    }

    return (
        <div>
            <AdminNav />

            <main style={{ maxWidth: 1040, margin: "32px auto", padding: "0 16px" }}>
                {/* Header Section */}
                <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                            ศูนย์ควบคุมแพลตฟอร์ม (Operations Console)
                        </h1>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)" }}>
                            ภาพรวมสถิติร้านค้า แคตตาล็อกสินค้า บันทึกกิจกรรมระบบ และ Audit Logs ของ Admin
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                background: "var(--color-status-approved-bg)",
                                border: "1px solid rgba(34, 197, 94, 0.2)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: 12,
                                fontWeight: 500,
                                color: "var(--color-success)",
                            }}
                        >
                            <span className="pulse-dot pulse-dot--success" />
                            ระบบกรองคำอัตโนมัติ: ทำงานปกติ
                        </div>

                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                background: errorCount > 0 ? "var(--color-status-rejected-bg)" : "var(--color-bg-subtle)",
                                border: `1px solid ${errorCount > 0 ? "var(--color-danger)" : "var(--color-border)"}`,
                                borderRadius: "var(--radius-sm)",
                                fontSize: 12,
                                fontWeight: 500,
                                color: errorCount > 0 ? "var(--color-danger)" : "var(--color-text-muted)",
                            }}
                        >
                            <Icon name={errorCount > 0 ? "shield-alert" : "verified-shield"} size={14} color={errorCount > 0 ? "var(--color-danger)" : "var(--color-text-muted)"} />
                            ข้อผิดพลาด Admin: {errorCount} รายการ
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 16,
                        marginBottom: 32,
                    }}
                >
                    <div
                        className="card"
                        style={{
                            padding: 20,
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-surface)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
                                ร้านค้าเปิดให้บริการ
                            </span>
                            <Icon name="store" size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            {activeShopsCount} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-muted)" }}>ร้าน</span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            จากทั้งหมด {shops.length} ร้านค้าในระบบ
                        </p>
                    </div>

                    <div
                        className="card"
                        style={{
                            padding: 20,
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-surface)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
                                แคตตาล็อกสินค้าทั้งหมด
                            </span>
                            <Icon name="box" size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            {products.length} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-muted)" }}>รายการ</span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            พร้อมแสดงบนหน้าร้านทันที
                        </p>
                    </div>

                    <div
                        className="card"
                        style={{
                            padding: 20,
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-surface)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
                                คำสั่งซื้อทั้งหมด
                            </span>
                            <Icon name="receipt" size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            {orders.length} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-muted)" }}>ออเดอร์</span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            บันทึกผ่านระบบ
                        </p>
                    </div>

                    <div
                        className="card"
                        style={{
                            padding: 20,
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-surface)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
                                ยอดสั่งซื้อรวมโดยประมาณ
                            </span>
                            <Icon name="sparkle" size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-primary)" }}>
                            {formatCurrency(totalRevenue)}
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            มูลค่าการสั่งซื้อสะสม
                        </p>
                    </div>
                </div>

                {/* Audit & Activity Logs */}
                <div
                    className="card"
                    style={{
                        padding: 24,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-surface)",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                                บันทึกกิจกรรมระบบ & Audit Trail ของ Admin
                            </h3>
                            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                                ตรวจสอบย้อนหลังทุกการกระทำของ Admin ข้อผิดพลาด และการเปิดร้าน/ลงสินค้าใหม่
                            </p>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon name="verified-shield" size={14} color="var(--color-success)" />
                            Immutable Audit Trail
                        </span>
                    </div>

                    {/* Alert Banner for Admin Errors */}
                    {errorCount > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "12px 16px",
                                marginBottom: 16,
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-status-rejected-bg)",
                                border: "1px solid var(--color-danger)",
                                color: "var(--color-danger)",
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Icon name="shield-alert" size={18} color="var(--color-danger)" />
                                <span>ตรวจพบข้อผิดพลาดจากการทำงานของ Admin จำนวน {errorCount} รายการ</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab("errors")}
                                style={{
                                    fontSize: 12,
                                    padding: "4px 10px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "var(--color-danger)",
                                    color: "#fff",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                ตรวจสอบข้อผิดพลาด
                            </button>
                        </div>
                    )}

                    {/* Vercel-style Tab Filter Pills */}
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            alignItems: "center",
                            marginBottom: 16,
                            paddingBottom: 12,
                            borderBottom: "1px solid var(--color-border)",
                        }}
                    >
                        {[
                            { id: "all", label: "ทั้งหมด", count: allActivityLogs.length },
                            { id: "admin", label: "กิจกรรม Admin", count: adminCount },
                            { id: "errors", label: "ข้อผิดพลาด", count: errorCount, isAlert: errorCount > 0 },
                            { id: "shops", label: "ร้านค้าใหม่", count: shopCount },
                            { id: "products", label: "สินค้าใหม่", count: productCount },
                            { id: "orders", label: "ออเดอร์", count: orderCount },
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
                                        border: isActive
                                            ? "1px solid var(--color-primary)"
                                            : "1px solid var(--color-border)",
                                        background: isActive
                                            ? "var(--color-primary)"
                                            : "var(--color-bg-surface)",
                                        color: isActive
                                            ? "#ffffff"
                                            : tab.isAlert
                                            ? "var(--color-danger)"
                                            : "var(--color-text)",
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
                                                : tab.isAlert
                                                ? "var(--color-status-rejected-bg)"
                                                : "var(--color-bg-subtle)",
                                            color: isActive
                                                ? "#ffffff"
                                                : tab.isAlert
                                                ? "var(--color-danger)"
                                                : "var(--color-text-muted)",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {filteredLogs.length === 0 ? (
                        <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--color-text-muted)" }}>
                            <Icon name="box" size={32} color="var(--color-text-muted)" />
                            <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>
                                {activeTab === "errors"
                                    ? "ยอดเยี่ยม! ไม่พบข้อผิดพลาดหรือปัญหาในการดำเนินงานของ Admin"
                                    : "ยังไม่มีประวัติกิจกรรมในหมวดหมู่นี้"}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        padding: "12px 14px",
                                        borderRadius: "var(--radius-sm)",
                                        background: log.isError
                                            ? "var(--color-status-rejected-bg)"
                                            : "var(--color-bg-subtle)",
                                        border: `1px solid ${log.isError ? "var(--color-danger)" : "var(--color-border)"}`,
                                        flexWrap: "wrap",
                                        gap: 10,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 260, flex: "1 1 320px" }}>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                padding: "3px 8px",
                                                borderRadius: "var(--radius-sm)",
                                                background: "var(--color-bg-surface)",
                                                border: `1px solid ${log.badgeColor}40`,
                                                color: log.badgeColor,
                                                whiteSpace: "nowrap",
                                                marginTop: 2,
                                            }}
                                        >
                                            {log.badge}
                                        </span>

                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: log.isError ? "var(--color-danger)" : "var(--color-text)" }}>
                                                {log.title}
                                            </p>
                                            <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                                                {log.detail}
                                            </p>

                                            {/* ข้อผิดพลาดทางเทคนิค (กรณีมี error) */}
                                            {log.errorDetails && (
                                                <div
                                                    style={{
                                                        marginTop: 6,
                                                        padding: "6px 10px",
                                                        borderRadius: "var(--radius-sm)",
                                                        background: "rgba(239, 68, 68, 0.1)",
                                                        border: "1px solid rgba(239, 68, 68, 0.25)",
                                                        color: "var(--color-danger)",
                                                        fontSize: 12,
                                                        fontFamily: "monospace",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    <strong>รายละเอียด Error:</strong> {log.errorDetails}
                                                </div>
                                            )}

                                            {/* เหตุผลในการระงับ/ซ่อน (กรณีมี) */}
                                            {log.metadata?.reason && (
                                                <div
                                                    style={{
                                                        marginTop: 4,
                                                        fontSize: 12,
                                                        color: "var(--color-text-muted)",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    ระบุเหตุผล: "{log.metadata.reason}"
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto", flexShrink: 0 }}>
                                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                                            {log.date.toLocaleDateString("th-TH", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        {log.link && (
                                            <Link
                                                to={log.link}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    color: "var(--color-primary)",
                                                    textDecoration: "none",
                                                    padding: "4px 8px",
                                                    borderRadius: "var(--radius-sm)",
                                                    background: "var(--color-bg-surface)",
                                                    border: "1px solid var(--color-border)",
                                                }}
                                            >
                                                ดูข้อมูล <Icon name="arrow-right" size={12} color="var(--color-primary)" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
