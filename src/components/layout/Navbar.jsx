// src/components/layout/Navbar.jsx — อัปเดต: Mobile Drawer Menu แทน flex-wrap แบบเดิม
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../firebase/auth";
import Icon from "../ui/Icon";

export default function Navbar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);

    async function handleLogout() {
        setDrawerOpen(false);
        await logoutUser();
        navigate("/");
    }

    const links = (
        <>
            <Link to="/" onClick={() => setDrawerOpen(false)}>
                ร้านค้า
            </Link>
            <Link to="/feed" onClick={() => setDrawerOpen(false)}>
                ประกาศ
            </Link>
            {user ? (
                <>
                    <Link to="/seller/dashboard" onClick={() => setDrawerOpen(false)}>
                        Dashboard ร้านฉัน
                    </Link>
                    <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{user.email}</span>
                    <button onClick={handleLogout}>
                        <Icon name="log-out" size={16} /> ออกจากระบบ
                    </button>
                </>
            ) : (
                <>
                    <Link to="/seller/login" onClick={() => setDrawerOpen(false)}>
                        เข้าสู่ระบบ
                    </Link>
                    <Link to="/seller/register" onClick={() => setDrawerOpen(false)}>
                        เปิดร้านค้า
                    </Link>
                </>
            )}
        </>
    );

    return (
        <nav
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-border)",
            }}
        >
            <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text)" }}>
                Rittiya Shop
            </Link>

            {/* เมนูปกติ — ซ่อนบนจอเล็กกว่า 640px (ดู index.css) */}
            <div className="navbar-links" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {links}
            </div>

            {/* ปุ่มแฮมเบอร์เกอร์ — โชว์เฉพาะจอเล็กกว่า 640px */}
            <button
                className="navbar-hamburger"
                onClick={() => setDrawerOpen(true)}
                aria-label="เปิดเมนู"
                style={{ border: "none", background: "transparent" }}
            >
                <Icon name="menu" size={22} />
            </button>

            {/* Drawer สำหรับมือถือ */}
            {drawerOpen && (
                <div className="navbar-drawer" onClick={() => setDrawerOpen(false)}>
                    <div className="navbar-drawer-panel" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setDrawerOpen(false)}
                            aria-label="ปิดเมนู"
                            style={{ alignSelf: "flex-end", border: "none", background: "transparent" }}
                        >
                            <Icon name="x" size={20} />
                        </button>
                        {links}
                    </div>
                </div>
            )}
        </nav>
    );
}