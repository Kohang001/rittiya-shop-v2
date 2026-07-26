// src/components/layout/Navbar.jsx — อัปเดต: ใช้ Icon สำหรับปุ่ม logout
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../firebase/auth";
import Icon from "../ui/Icon";

export default function Navbar() {
    const { user } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logoutUser();
        navigate("/");
    }

    return (
        <nav
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-border)",
                flexWrap: "wrap",
                gap: 10,
            }}
        >
            <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text)" }}>
                Rittiya Shop
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Link to="/">ร้านค้า</Link>
                <Link to="/feed">ประกาศ</Link>
                {user ? (
                    <>
                        <Link to="/seller/dashboard">Dashboard ร้านฉัน</Link>
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{user.email}</span>
                        <button onClick={handleLogout}>
                            <Icon name="log-out" size={16} /> ออกจากระบบ
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/seller/login">เข้าสู่ระบบ</Link>
                        <Link to="/seller/register">เปิดร้านค้า</Link>
                    </>
                )}
            </div>
        </nav>
    );
}