// src/pages/admin/AdminDashboardPage.jsx
// แดชบอร์ดภาพรวมและการดำเนินงานของผู้ดูแลระบบ (Operations & Platform Health)
// พร้อมระบบ Audit Trail บันทึกทุกกิจกรรมของแพลตฟอร์ม และค้นหาตามเวลา/ชื่อกิจกรรม
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getAllShopsForAdmin,
    getAllProductsForAdmin,
    getAllOrdersForAdmin,
    getAdminLogs,
    getAllUsersForAdmin,
    getAllFeedPostsForAdmin,
} from "../../firebase/firestore";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";
import { formatCurrency } from "../../utils/formatCurrency";

/**
 * ป้องกันการแสดงรหัสเชื่อมต่อ (Connection / Pairing Codes) ในหน้า Log เด็ดขาดเพื่อความปลอดภัย
 */
function sanitizeLogText(text) {
    if (!text || typeof text !== "string") return text || "";
    return text
        .replace(/ADMIN-[A-Z0-9]+/gi, "[รหัสเชื่อมต่อถูกซ่อน]")
        .replace(/SHOP-[A-Z0-9]+/gi, "[รหัสเชื่อมต่อถูกซ่อน]")
        .replace(/lineLinkCode\s*[:=]\s*[A-Z0-9-]+/gi, "[รหัสเชื่อมต่อถูกซ่อน]")
        .replace(/รหัส(?:ผูก|เชื่อมต่อ)?\s*[:=]\s*[A-Z0-9-]+/gi, "[รหัสเชื่อมต่อถูกซ่อน]");
}

export default function AdminDashboardPage() {
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [adminLogs, setAdminLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [feedPosts, setFeedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & Search
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [timeFilter, setTimeFilter] = useState("all"); // "all" | "today" | "7days" | "30days" | "custom"
    const [customDate, setCustomDate] = useState("");
    const [displayLimit, setDisplayLimit] = useState(50);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [shopsData, productsData, ordersData, adminLogsData, usersData, feedPostsData] = await Promise.all([
                    getAllShopsForAdmin().catch(() => []),
                    getAllProductsForAdmin().catch(() => []),
                    getAllOrdersForAdmin().catch(() => []),
                    getAdminLogs(100).catch(() => []),
                    getAllUsersForAdmin(100).catch(() => []),
                    getAllFeedPostsForAdmin().catch(() => []),
                ]);
                setShops(shopsData);
                setProducts(productsData);
                setOrders(ordersData);
                setAdminLogs(adminLogsData);
                setUsers(usersData);
                setFeedPosts(feedPostsData);
            } catch (err) {
                console.error("Failed to load admin dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // คำนวณยอดขายรวมโดยประมาณ
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total || o.totalPrice) || 0), 0);
    const activeShopsCount = shops.filter((s) => s.status !== "rejected").length;

    // รวบรวม Activity Logs ทั้งหมดจาก Admin Logs, สมาชิกใหม่, ร้านค้า, สินค้า, และออเดอร์
    const allActivityLogs = useMemo(() => {
        const logs = [];

        // 1. Audit Trail จริงจาก Firestore adminLogs
        adminLogs.forEach((l) => {
            const isError = l.status === "error";
            let badge = "Admin";
            let badgeColor = "var(--color-primary)";
            let category = "admin";

            if (isError) {
                badge = "ข้อผิดพลาด";
                badgeColor = "var(--color-danger, #ef4444)";
                category = "errors";
            } else if (l.action === "user_registered") {
                badge = "สมาชิกใหม่";
                badgeColor = "#8b5cf6";
                category = "users";
            } else if (l.action === "line_user_linked") {
                badge = "LINE ลูกค้า";
                badgeColor = "#8b5cf6";
                category = "users";
            } else if (l.action === "shop_registered") {
                badge = "ร้านใหม่";
                badgeColor = "var(--color-primary)";
                category = "shops";
            } else if (l.action === "shop_updated") {
                badge = "แก้ไขร้าน";
                badgeColor = "#0ea5e9";
                category = "shops";
            } else if (l.action === "shop_opened") {
                badge = "เปิดร้าน";
                badgeColor = "var(--color-success, #22c55e)";
                category = "shops";
            } else if (l.action === "shop_closed") {
                badge = "ปิดร้าน";
                badgeColor = "#f59e0b";
                category = "shops";
            } else if (l.action === "line_shop_opened") {
                badge = "LINE เปิดร้าน";
                badgeColor = "var(--color-success, #22c55e)";
                category = "shops";
            } else if (l.action === "line_shop_closed") {
                badge = "LINE ปิดร้าน";
                badgeColor = "#f59e0b";
                category = "shops";
            } else if (l.action === "line_shop_linked") {
                badge = "LINE ร้านค้า";
                badgeColor = "#8b5cf6";
                category = "shops";
            } else if (l.action === "order_created") {
                badge = "ออเดอร์";
                badgeColor = "var(--color-info, #2563eb)";
                category = "orders";
            } else if (l.action === "feed_post_created") {
                badge = "ประกาศใหม่";
                badgeColor = "#06b6d4";
                category = "feed";
            } else if (l.action === "hide_feed_post") {
                badge = "ซ่อนประกาศ";
                badgeColor = "#f59e0b";
                category = "feed";
            } else if (l.action === "unhide_feed_post") {
                badge = "เลิกซ่อน";
                badgeColor = "var(--color-success, #22c55e)";
                category = "feed";
            } else if (l.action === "delete_feed_post") {
                badge = "ลบประกาศ";
                badgeColor = "#ef4444";
                category = "feed";
            } else if (l.action === "line_admin_linked") {
                badge = "LINE Admin";
                badgeColor = "#ec4899";
                category = "admin";
            } else if (l.action === "grant_admin_role" || l.action === "revoke_admin_role") {
                badge = "สิทธิ์ Admin";
                badgeColor = "#ec4899";
                category = "admin";
            } else if (l.action === "reset_admin_line") {
                badge = "รีเซ็ต LINE";
                badgeColor = "#f59e0b";
                category = "admin";
            } else if (l.action === "suspend_shop" || l.action === "hide_product") {
                badge = "ระงับ/ซ่อน";
                badgeColor = "#f59e0b";
                category = "admin";
            } else if (l.action === "activate_shop" || l.action === "unhide_product") {
                badge = "คืนสภาพ";
                badgeColor = "var(--color-success, #22c55e)";
                category = "admin";
            } else if (l.action === "admin_login") {
                badge = "Admin Login";
                badgeColor = "var(--color-info, #3b82f6)";
                category = "admin";
            }

            let link = "/admin";
            if (l.targetType === "shop" && l.targetId) {
                link = `/admin/shops/${l.targetId}`;
            } else if (l.targetType === "product") {
                link = `/admin/products`;
            } else if (l.targetType === "order") {
                link = `/admin/orders`;
            } else if (l.targetType === "feedPost") {
                link = `/admin/feed`;
            } else if (
                l.action === "grant_admin_role" ||
                l.action === "revoke_admin_role" ||
                l.action === "reset_admin_line"
            ) {
                link = `/admin/roles`;
            }

            logs.push({
                id: `admin-log-${l.id}`,
                type: category,
                action: l.action,
                isError,
                title: sanitizeLogText(l.detail || `กิจกรรม Admin: ${l.action}`),
                detail: sanitizeLogText(
                    `โดย: ${l.actorEmail || "Admin"}${l.metadata?.reason ? ` · เหตุผล: ${l.metadata.reason}` : ""}`
                ),
                errorDetails: l.errorDetails ? sanitizeLogText(l.errorDetails) : null,
                metadata: l.metadata || null,
                date: l.createdAt?.toDate
                    ? l.createdAt.toDate()
                    : l.createdAt
                    ? new Date(l.createdAt)
                    : new Date(),
                badge,
                badgeColor,
                link,
            });
        });

        // 2. ข้อมูลสมาชิกใหม่ (users collection)
        users.forEach((u) => {
            const hasLog = logs.some(
                (l) => l.action === "user_registered" && l.title.includes(u.email || u.id)
            );
            if (!hasLog) {
                const date = u.createdAt?.toDate
                    ? u.createdAt.toDate()
                    : u.createdAt
                    ? new Date(u.createdAt)
                    : new Date();
                logs.push({
                    id: `user-${u.id}`,
                    type: "users",
                    action: "user_registered",
                    isError: false,
                    title: sanitizeLogText(`สมาชิกใหม่ลงทะเบียน: ${u.displayName || u.email || "ผู้ใช้ทั่วไป"}`),
                    detail: sanitizeLogText(
                        `อีเมล: ${u.email || "-"} · เบอร์: ${u.phone || "-"} · นัดรับ: ${u.pickupLocation || "ยังไม่ระบุ"}`
                    ),
                    date,
                    badge: "สมาชิกใหม่",
                    badgeColor: "#8b5cf6",
                    link: null,
                });
            }
        });

        // 3. ร้านค้าเปิดใหม่ (shops collection)
        shops.forEach((s) => {
            const hasLog = logs.some(
                (l) => l.action === "shop_registered" && l.title.includes(s.name)
            );
            if (!hasLog) {
                const date = s.createdAt?.toDate
                    ? s.createdAt.toDate()
                    : s.createdAt
                    ? new Date(s.createdAt)
                    : new Date();
                logs.push({
                    id: `shop-${s.id}`,
                    type: "shops",
                    action: "shop_registered",
                    isError: false,
                    title: sanitizeLogText(`ร้านค้าเปิดใหม่: ${s.name}`),
                    detail: sanitizeLogText(`หมวดหมู่: ${s.category || "ทั่วไป"} · เบอร์ติดต่อ: ${s.phone || "-"}`),
                    date,
                    badge: "ร้านใหม่",
                    badgeColor: "var(--color-primary)",
                    link: `/admin/shops/${s.id}`,
                });
            }
        });

        // 4. สินค้าใหม่ (products collection)
        products.forEach((p) => {
            const date = p.createdAt?.toDate
                ? p.createdAt.toDate()
                : p.createdAt
                ? new Date(p.createdAt)
                : new Date();
            logs.push({
                id: `prod-${p.id}`,
                type: "products",
                action: "product_created",
                isError: false,
                title: sanitizeLogText(`เพิ่มสินค้าใหม่: ${p.name}`),
                detail: sanitizeLogText(
                    `ราคา: ${formatCurrency(p.price)} · ร้านค้า: ${p.shopName || p.shopId || "-"}`
                ),
                date,
                badge: "สินค้าใหม่",
                badgeColor: "var(--color-success)",
                link: `/admin/products`,
            });
        });

        // 5. ออเดอร์ใหม่ (orders collection)
        orders.forEach((o) => {
            const hasLog = logs.some(
                (l) => l.action === "order_created" && l.title.includes(o.id.slice(0, 7))
            );
            if (!hasLog) {
                const date = o.createdAt?.toDate
                    ? o.createdAt.toDate()
                    : o.createdAt
                    ? new Date(o.createdAt)
                    : new Date();
                logs.push({
                    id: `order-${o.id}`,
                    type: "orders",
                    action: "order_created",
                    isError: false,
                    title: sanitizeLogText(`ออเดอร์ใหม่: #${o.id.slice(0, 7).toUpperCase()}`),
                    detail: sanitizeLogText(
                        `ยอดรวม: ${formatCurrency(o.total || o.totalPrice || 0)} · ลูกค้า: ${o.customerName || "-"} · นัดรับ: ${o.pickupLocation || "-"}`
                    ),
                    date,
                    badge: "ออเดอร์",
                    badgeColor: "var(--color-info, #2563eb)",
                    link: `/admin/orders`,
                });
            }
        });

        // 6. ข้อมูลประกาศข่าวสาร (feedPosts collection)
        feedPosts.forEach((fp) => {
            const hasLog = logs.some(
                (l) => l.action === "feed_post_created" && (l.title.includes(fp.title || "") || l.id === `admin-log-${fp.id}`)
            );
            if (!hasLog) {
                const date = fp.createdAt?.toDate
                    ? fp.createdAt.toDate()
                    : fp.createdAt
                    ? new Date(fp.createdAt)
                    : new Date();
                logs.push({
                    id: `feed-${fp.id}`,
                    type: "feed",
                    action: "feed_post_created",
                    isError: false,
                    title: sanitizeLogText(`ประกาศ: ${fp.title || "ข่าวสารใหม่"}`),
                    detail: sanitizeLogText(
                        `โดย: ${fp.authorRole === "super" ? "Super Admin" : fp.shopName || "ระบบ"} · สถานะ: ${fp.status === "rejected" ? "ซ่อนอยู่" : "เผยแพร่แล้ว"}`
                    ),
                    date,
                    badge: "ประกาศ",
                    badgeColor: "#06b6d4",
                    link: `/admin/feed`,
                });
            }
        });

        // เรียงจากล่าสุดไปเก่าสุด
        logs.sort((a, b) => b.date.getTime() - a.date.getTime());
        return logs;
    }, [adminLogs, users, shops, products, orders, feedPosts]);

    // นับจำนวนแยกตามหมวดหมู่
    const counts = useMemo(() => {
        return {
            all: allActivityLogs.length,
            users: allActivityLogs.filter((l) => l.type === "users").length,
            shops: allActivityLogs.filter((l) => l.type === "shops").length,
            products: allActivityLogs.filter((l) => l.type === "products").length,
            orders: allActivityLogs.filter((l) => l.type === "orders").length,
            feed: allActivityLogs.filter((l) => l.type === "feed").length,
            admin: allActivityLogs.filter((l) => l.type === "admin").length,
            errors: allActivityLogs.filter((l) => l.isError).length,
        };
    }, [allActivityLogs]);

    // กรอง Log ตาม Search Query, Time Filter, และ Category Tab
    const filteredLogs = useMemo(() => {
        let result = allActivityLogs;

        // 1. กรองตามหมวดหมู่ Tab
        if (activeTab === "errors") {
            result = result.filter((l) => l.isError);
        } else if (activeTab !== "all") {
            result = result.filter((l) => l.type === activeTab);
        }

        // 2. กรองตามช่วงเวลา
        const now = new Date();
        if (timeFilter === "today") {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            result = result.filter((l) => l.date.getTime() >= todayStart);
        } else if (timeFilter === "7days") {
            const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
            result = result.filter((l) => l.date.getTime() >= sevenDaysAgo);
        } else if (timeFilter === "30days") {
            const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
            result = result.filter((l) => l.date.getTime() >= thirtyDaysAgo);
        } else if (timeFilter === "custom" && customDate) {
            result = result.filter((l) => {
                const year = l.date.getFullYear();
                const month = String(l.date.getMonth() + 1).padStart(2, "0");
                const day = String(l.date.getDate()).padStart(2, "0");
                const formatted = `${year}-${month}-${day}`;
                return formatted === customDate;
            });
        }

        // 3. กรองตามคำค้นหา (ชื่อกิจกรรม, เนื้อหา, อีเมลผู้กระทำ, ป้าย)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (l) =>
                    l.title.toLowerCase().includes(q) ||
                    l.detail.toLowerCase().includes(q) ||
                    l.badge.toLowerCase().includes(q) ||
                    (l.action && l.action.toLowerCase().includes(q))
            );
        }

        return result;
    }, [allActivityLogs, activeTab, timeFilter, customDate, searchQuery]);

    const displayedLogs = filteredLogs.slice(0, displayLimit);

    function resetAllFilters() {
        setActiveTab("all");
        setSearchQuery("");
        setTimeFilter("all");
        setCustomDate("");
        setDisplayLimit(50);
    }

    if (loading) {
        return (
            <div>
                <AdminNav />
                <div style={{ maxWidth: 1080, margin: "32px auto", padding: "0 16px" }}>
                    <PageSkeleton lines={7} />
                </div>
            </div>
        );
    }

    return (
        <div>
            <AdminNav />

            <main style={{ maxWidth: 1080, margin: "32px auto", padding: "0 16px" }}>
                {/* Header Section */}
                <div
                    style={{
                        marginBottom: 24,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                        gap: 12,
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: "clamp(22px, 3.5vw, 28px)",
                                fontWeight: 700,
                                margin: "0 0 6px 0",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            ศูนย์ควบคุมแพลตฟอร์ม (Operations Console)
                        </h1>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)" }}>
                            ภาพรวมสถิติร้านค้า สมาชิก แคตตาล็อกสินค้า และประวัติกิจกรรมแพลตฟอร์มแบบเรียลไทม์
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
                                background:
                                    counts.errors > 0
                                        ? "var(--color-status-rejected-bg)"
                                        : "var(--color-bg-subtle)",
                                border: `1px solid ${counts.errors > 0 ? "var(--color-danger)" : "var(--color-border)"}`,
                                borderRadius: "var(--radius-sm)",
                                fontSize: 12,
                                fontWeight: 500,
                                color: counts.errors > 0 ? "var(--color-danger)" : "var(--color-text-muted)",
                            }}
                        >
                            <Icon
                                name={counts.errors > 0 ? "shield-alert" : "verified-shield"}
                                size={14}
                                color={counts.errors > 0 ? "var(--color-danger)" : "var(--color-text-muted)"}
                            />
                            ข้อผิดพลาดระบบ: {counts.errors} รายการ
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Grid (5 คอลัมน์ รองรับมือถือและจอคอมพิวเตอร์) */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
                                สมาชิกทั่วไป
                            </span>
                            <Icon name="user" size={18} color="#8b5cf6" />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            {users.length} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-muted)" }}>คน</span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            บัญชีผู้ใช้ในระบบ
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
                                ร้านค้าที่เปิดบริการ
                            </span>
                            <Icon name="store" size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            {activeShopsCount} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-muted)" }}>ร้าน</span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            จากทั้งหมด {shops.length} ร้าน
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
                                สินค้าทั้งหมด
                            </span>
                            <Icon name="box" size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            {products.length} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-muted)" }}>รายการ</span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            ในแคตตาล็อกร้านค้า
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
                        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
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
                                ยอดสั่งซื้อสะสม
                            </span>
                            <Icon name="sparkle" size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-primary)" }}>
                            {formatCurrency(totalRevenue)}
                        </div>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                            มูลค่าสั่งซื้อรวม
                        </p>
                    </div>
                </div>

                {/* Audit & Activity Logs Section */}
                <div
                    className="card"
                    style={{
                        padding: 24,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-surface)",
                    }}
                >
                    {/* Section Title */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 20,
                            flexWrap: "wrap",
                            gap: 10,
                        }}
                    >
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                                บันทึกกิจกรรมแพลตฟอร์ม & Audit Trail
                            </h3>
                            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                                ตรวจสอบทุกกิจกรรม: สมาชิกใหม่, ร้านค้า, สินค้า, ออเดอร์, การกระทำของ Admin พร้อมค้นหาตามชื่อและเวลา
                            </p>
                        </div>
                        <span
                            style={{
                                fontSize: 12,
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 8px",
                                background: "var(--color-bg-subtle)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            <Icon name="verified-shield" size={14} color="var(--color-success)" />
                            Immutable Audit Log (ห้ามแสดงรหัสเชื่อมต่อ)
                        </span>
                    </div>

                    {/* Alert Banner for Errors */}
                    {counts.errors > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "12px 16px",
                                marginBottom: 20,
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
                                <span>ตรวจพบข้อผิดพลาดจากการทำงาน {counts.errors} รายการ</span>
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
                                ดูเฉพาะข้อผิดพลาด
                            </button>
                        </div>
                    )}

                    {/* Filter & Search Bar */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            marginBottom: 20,
                            padding: 16,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-bg-subtle)",
                            border: "1px solid var(--color-border)",
                        }}
                    >
                        {/* Row 1: Search & Date Controls */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            {/* Search Input */}
                            <div style={{ position: "relative", flex: "1 1 280px" }}>
                                <span
                                    style={{
                                        position: "absolute",
                                        left: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "var(--color-text-muted)",
                                        pointerEvents: "none",
                                        display: "flex",
                                    }}
                                >
                                    <Icon name="search" size={16} />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ค้นตามชื่อกิจกรรม, สมาชิก, รายละเอียด หรือป้าย..."
                                    style={{
                                        width: "100%",
                                        padding: "8px 36px 8px 36px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        fontSize: 13,
                                        color: "var(--color-text)",
                                        boxSizing: "border-box",
                                        minHeight: 40,
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        style={{
                                            position: "absolute",
                                            right: 10,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            color: "var(--color-text-muted)",
                                            cursor: "pointer",
                                            padding: 4,
                                            display: "flex",
                                        }}
                                        title="ล้างข้อความค้นหา"
                                    >
                                        <Icon name="x" size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Time Filters */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginRight: 2 }}>
                                    ช่วงเวลา:
                                </span>
                                {[
                                    { id: "all", label: "ทั้งหมด" },
                                    { id: "today", label: "วันนี้" },
                                    { id: "7days", label: "7 วันล่าสุด" },
                                    { id: "30days", label: "30 วันล่าสุด" },
                                    { id: "custom", label: "เลือกวันที่" },
                                ].map((t) => {
                                    const isSelected = timeFilter === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setTimeFilter(t.id);
                                                if (t.id !== "custom") setCustomDate("");
                                            }}
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 12px",
                                                borderRadius: "var(--radius-sm)",
                                                border: isSelected
                                                    ? "1px solid var(--color-primary)"
                                                    : "1px solid var(--color-border)",
                                                background: isSelected
                                                    ? "var(--color-primary)"
                                                    : "var(--color-bg-surface)",
                                                color: isSelected ? "#ffffff" : "var(--color-text)",
                                                fontWeight: isSelected ? 600 : 500,
                                                cursor: "pointer",
                                                minHeight: 36,
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}

                                {timeFilter === "custom" && (
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: "var(--radius-sm)",
                                            border: "1px solid var(--color-border)",
                                            background: "var(--color-bg-surface)",
                                            fontSize: 12,
                                            color: "var(--color-text)",
                                            minHeight: 36,
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Row 2: Category Filter Tabs */}
                        <div
                            style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                                alignItems: "center",
                                paddingTop: 10,
                                borderTop: "1px solid var(--color-border)",
                            }}
                        >
                            {[
                                { id: "all", label: "ทั้งหมด", count: counts.all },
                                { id: "users", label: "สมาชิกใหม่", count: counts.users },
                                { id: "shops", label: "ร้านค้า", count: counts.shops },
                                { id: "products", label: "สินค้า", count: counts.products },
                                { id: "orders", label: "ออเดอร์", count: counts.orders },
                                { id: "feed", label: "ประกาศ", count: counts.feed },
                                { id: "admin", label: "กิจกรรม Admin", count: counts.admin },
                                { id: "errors", label: "ข้อผิดพลาด", count: counts.errors, isAlert: counts.errors > 0 },
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
                    </div>

                    {/* Result Count and Active Filters Notice */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 14,
                            fontSize: 12,
                            color: "var(--color-text-muted)",
                            flexWrap: "wrap",
                            gap: 8,
                        }}
                    >
                        <span>
                            แสดงผล <strong>{displayedLogs.length}</strong> จากผลการกรอง{" "}
                            <strong>{filteredLogs.length}</strong> รายการ (จากกิจกรรมทั้งหมด {allActivityLogs.length} รายการ)
                        </span>

                        {(searchQuery || timeFilter !== "all" || activeTab !== "all") && (
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 12,
                                    color: "var(--color-primary)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontWeight: 500,
                                }}
                            >
                                <Icon name="refresh" size={12} />
                                ล้างตัวกรองทั้งหมด
                            </button>
                        )}
                    </div>

                    {/* Logs Stream */}
                    {filteredLogs.length === 0 ? (
                        <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--color-text-muted)" }}>
                            <Icon name="box" size={36} color="var(--color-text-muted)" />
                            <p style={{ margin: "12px 0 6px 0", fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                                {activeTab === "errors"
                                    ? "ยอดเยี่ยม! ไม่พบข้อผิดพลาดหรือปัญหาในระบบ"
                                    : "ไม่พบกิจกรรมที่ตรงกับเงื่อนไขการค้นหา"}
                            </p>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                                ลองเปลี่ยนคำค้นหา หรือเลือกช่วงเวลาอื่น
                            </p>
                            {(searchQuery || timeFilter !== "all" || activeTab !== "all") && (
                                <button
                                    type="button"
                                    onClick={resetAllFilters}
                                    style={{
                                        marginTop: 14,
                                        padding: "6px 14px",
                                        borderRadius: "var(--radius-sm)",
                                        background: "var(--color-bg-surface)",
                                        border: "1px solid var(--color-border)",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    ล้างการค้นหาและตัวกรอง
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {displayedLogs.map((log) => (
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
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 12,
                                            minWidth: 260,
                                            flex: "1 1 320px",
                                        }}
                                    >
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
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 600,
                                                    fontSize: 14,
                                                    color: log.isError ? "var(--color-danger)" : "var(--color-text)",
                                                }}
                                            >
                                                {log.title}
                                            </p>
                                            <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                                                {log.detail}
                                            </p>

                                            {/* ข้อผิดพลาดทางเทคนิค (ถ้ามี) */}
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

                                            {/* เหตุผล (ถ้ามี) */}
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

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 14,
                                            marginLeft: "auto",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                                            {log.date.toLocaleDateString("th-TH", {
                                                year: "numeric",
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

                            {/* Load more button if there are more logs */}
                            {filteredLogs.length > displayLimit && (
                                <div style={{ textAlign: "center", marginTop: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => setDisplayLimit((prev) => prev + 50)}
                                        style={{
                                            padding: "8px 20px",
                                            borderRadius: "var(--radius-sm)",
                                            background: "var(--color-bg-surface)",
                                            border: "1px solid var(--color-border)",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            color: "var(--color-primary)",
                                        }}
                                    >
                                        โหลดกิจกรรมเพิ่มเติม (+50 รายการ)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
