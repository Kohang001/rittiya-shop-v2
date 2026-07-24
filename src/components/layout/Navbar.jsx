// src/components/layout/Navbar.jsx — อัปเดต: แสดงอีเมลที่ login อยู่ + ปุ่ม logout ที่กดได้จากทุกหน้า
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../firebase/auth";

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
                borderBottom: "1px solid #eee",
                flexWrap: "wrap",
                gap: 10,
            }}
        >
            <Link to="/" style={{ fontWeight: "bold", fontSize: 18, textDecoration: "none", color: "inherit" }}>
                Rittiya Shop
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Link to="/">ร้านค้า</Link>
                <Link to="/feed">ประกาศ</Link>
                {user ? (
                    <>
                        <Link to="/seller/dashboard">Dashboard ร้านฉัน</Link>
                        <span style={{ fontSize: 13, color: "#666" }}>{user.email}</span>
                        <button onClick={handleLogout}>ออกจากระบบ</button>
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