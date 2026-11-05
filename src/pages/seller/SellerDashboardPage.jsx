// src/pages/seller/SellerDashboardPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { logoutUser } from "../../firebase/auth";
import { getShopsByOwner, getOrdersByShop, setShopOpenStatus, updateShopInfo, logAdminAction } from "../../firebase/firestore";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";

export default function SellerDashboardPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [orderCount, setOrderCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [togglingOpen, setTogglingOpen] = useState(false);

    useEffect(() => {
        async function load() {
            const shops = await getShopsByOwner(user.uid);
            const myShop = shops[0] || null;
            setShop(myShop);
            if (myShop) {
                // หากร้านค้ายังเป็น pending ให้ลองอัปเดตเป็น approved เบื้องหลัง
                if (myShop.status === "pending") {
                    updateShopInfo(myShop.id, { status: "approved" }).catch(() => {});
                }
                const orders = await getOrdersByShop(myShop.id);
                setOrderCount(orders.length);
            }
            setLoading(false);
        }
        load();
    }, [user]);

    async function handleLogout() {
        await logoutUser();
        navigate("/seller/login");
    }

    async function handleToggleOpen() {
        setTogglingOpen(true);
        try {
            const newValue = !(shop.isOpen !== false);
            await setShopOpenStatus(shop.id, newValue);
            setShop({ ...shop, isOpen: newValue });

            // บันทึก Activity Log สำหรับการเปิด/ปิดร้านบนหน้าเว็บ
            logAdminAction({
                action: newValue ? "shop_opened" : "shop_closed",
                targetType: "shop",
                targetId: shop.id,
                targetName: shop.name,
                detail: `ร้านค้า "${shop.name}" เปลี่ยนสถานะบนเว็บเป็น: ${newValue ? "เปิดรับออเดอร์" : "ปิดรับออเดอร์ชั่วคราว"}`,
                status: newValue ? "success" : "warning",
                actorEmail: user?.email || "Seller",
                actorUid: user?.uid || shop.ownerUid,
            }).catch(() => {});

            showToast(newValue ? "เปิดร้านแล้ว" : "ปิดร้านชั่วคราวแล้ว", "success");
        } catch {
            showToast("เปลี่ยนสถานะร้านไม่สำเร็จ", "error");
        } finally {
            setTogglingOpen(false);
        }
    }

    if (loading) return <PageSkeleton lines={5} />;

    if (!shop) {
        return (
            <div style={{ maxWidth: 500, margin: "40px auto", textAlign: "center", padding: "0 16px" }}>
                <p>ยังไม่มีร้านค้าผูกกับบัญชีนี้</p>
                <Link to="/seller/register" className="nav-link-btn" style={{ justifyContent: "center" }}>
                    สมัครเปิดร้าน
                </Link>
            </div>
        );
    }

    // ในระบบอนุมัติอัตโนมัติ หากร้านค้าไม่ถูกปฏิเสธ (rejected) ถือว่าอนุมัติและเปิดขายได้ทันที
    const isApproved = shop.status !== "rejected";

    return (
        <div style={{ maxWidth: 600, margin: "32px auto", padding: "0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "clamp(20px, 4vw, 24px)" }}>{shop.name}</h2>
                    <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>{user.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        fontSize: 13,
                        background: "var(--color-bg-subtle)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                    }}
                >
                    <Icon name="log-out" size={16} /> ออกจากระบบ
                </button>
            </div>

            {/* แสดงสถานะร้านค้า */}
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: isApproved ? "var(--color-status-approved-bg)" : "var(--color-status-rejected-bg)",
                    border: `1px solid ${isApproved ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                    margin: "6px 0 16px 0",
                }}
            >
                <span className={`pulse-dot pulse-dot--${isApproved ? "success" : "rejected"}`} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                    สถานะร้าน:{" "}
                    <strong style={{ color: isApproved ? "var(--color-success)" : "var(--color-danger)" }}>
                        {isApproved ? "อนุมัติแล้ว (เปิดร้านแล้ว)" : "ไม่อนุมัติ"}
                    </strong>
                </span>
            </div>

            {/* การสลับเปิด/ปิดร้าน */}
            {isApproved && (
                <div className="toggle-switch-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={`pulse-dot pulse-dot--${shop.isOpen !== false ? "success" : "warning"}`} />
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                                {shop.isOpen !== false ? "ร้านเปิดรับออเดอร์อยู่" : "ร้านปิดรับออเดอร์ชั่วคราว"}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                                {shop.isOpen !== false ? "ลูกค้าสามารถเลือกชมและสั่งซื้อสินค้าได้" : "หยุดรับออเดอร์ใหม่ชั่วคราว"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleOpen}
                        disabled={togglingOpen}
                        className={`toggle-switch-btn ${shop.isOpen !== false ? "toggle-switch-btn--active" : ""}`}
                        aria-label="เปลี่ยนสถานะเปิด/ปิดร้าน"
                        title={shop.isOpen !== false ? "แตะเพื่อปิดร้านชั่วคราว" : "แตะเพื่อเปิดร้าน"}
                    >
                        <span className="toggle-switch-thumb" />
                    </button>
                </div>
            )}

            {shop.status === "rejected" && shop.rejectReason && (
                <div
                    style={{
                        padding: 12,
                        background: "var(--color-status-rejected-bg)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-danger)",
                        fontSize: 13,
                        marginTop: 12,
                    }}
                >
                    เหตุผลที่ไม่อนุมัติ: {shop.rejectReason}
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 12,
                    marginTop: 20,
                }}
            >
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 16, background: "var(--color-bg-surface)" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>ออเดอร์ทั้งหมด</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: 26, fontWeight: 700 }}>{orderCount}</p>
                </div>
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 16, background: "var(--color-bg-surface)" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>หมวดหมู่ร้าน</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: 16, fontWeight: 600 }}>{shop.category || "ทั่วไป"}</p>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                <Link to="/seller/shop/edit" className="nav-link-btn">
                    <Icon name="settings" size={18} /> แก้ไขข้อมูลร้าน
                </Link>
                <Link to="/seller/products" className="nav-link-btn">
                    <Icon name="box" size={18} /> จัดการสินค้า
                </Link>
                <Link to="/seller/orders" className="nav-link-btn">
                    <Icon name="receipt" size={18} /> ดูออเดอร์
                </Link>
                <Link to="/seller/line-link" className="nav-link-btn">
                    <Icon name="message-circle" size={18} /> เชื่อมต่อ LINE
                </Link>
                <Link to="/seller/feed/new" className="nav-link-btn">
                    <Icon name="megaphone" size={18} /> เพิ่มประกาศ
                </Link>
            </div>
        </div>
    );
}
