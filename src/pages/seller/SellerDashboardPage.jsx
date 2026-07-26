// src/pages/seller/SellerDashboardPage.jsx — อัปเดต: ใช้ Icon component แทนอิโมจิ
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../firebase/auth";
import { getShopsByOwner, getOrdersByShop } from "../../firebase/firestore";
import Icon from "../../components/ui/Icon";

const STATUS_LABEL = {
    pending: { text: "รอตรวจสอบ", color: "var(--color-warning)" },
    approved: { text: "อนุมัติแล้ว", color: "var(--color-success)" },
    rejected: { text: "ไม่อนุมัติ", color: "var(--color-danger)" },
};

export default function SellerDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [orderCount, setOrderCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const shops = await getShopsByOwner(user.uid);
            const myShop = shops[0] || null;
            setShop(myShop);
            if (myShop) {
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

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;

    if (!shop) {
        return (
            <div style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
                <p>ยังไม่มีร้านค้าผูกกับบัญชีนี้</p>
                <Link to="/seller/register">สมัครเปิดร้าน</Link>
            </div>
        );
    }

    const statusInfo = STATUS_LABEL[shop.status] || { text: shop.status, color: "var(--color-text-muted)" };

    return (
        <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>{shop.name}</h2>
                <button onClick={handleLogout}>
                    <Icon name="log-out" size={16} /> ออกจากระบบ
                </button>
            </div>

            <p style={{ margin: "8px 0" }}>
                สถานะร้าน: <strong style={{ color: statusInfo.color }}>{statusInfo.text}</strong>
            </p>

            {shop.status === "rejected" && shop.rejectReason && (
                <p style={{ color: "var(--color-danger)", fontSize: 14 }}>เหตุผล: {shop.rejectReason}</p>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 12,
                    marginTop: 20,
                }}
            >
                <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: 14 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>ออเดอร์ทั้งหมด</p>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{orderCount}</p>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                <Link to="/seller/products" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="box" size={20} /> จัดการสินค้า
                </Link>
                <Link to="/seller/orders" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="receipt" size={20} /> ดูออเดอร์
                </Link>
                <Link to="/seller/line-link" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="message-circle" size={20} /> เชื่อมต่อ LINE
                </Link>
                <Link to="/seller/feed/new" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="megaphone" size={20} /> เพิ่มประกาศ
                </Link>
            </div>
        </div>
    );
}