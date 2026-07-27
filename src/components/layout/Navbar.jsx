// src/components/layout/Navbar.jsx — อัปเดต: Header เรียบเสมอทุกขนาดจอ (Brand + 2 ลิงก์ + เมนู)
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

            {/* Header หลัก — เรียบเสมอทุกขนาดจอ มีแค่นี้ */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Link to="/">ร้านค้า</Link>
                <Link to="/feed">ประกาศ</Link>
                <button
                    onClick={() => setDrawerOpen(true)}
                    aria-label="เปิดเมนู"
                    style={{ border: "none", background: "transparent" }}
                >
                    <Icon name="menu" size={22} />
                </button>
            </div>

            {/* Drawer — รวมทุกอย่างที่เกี่ยวกับบัญชี ไม่ว่าจอไหนก็เข้าทางนี้ทางเดียว */}
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

                        {user ? (
                            <>
                                <Link to="/seller/dashboard" onClick={() => setDrawerOpen(false)}>
                                    Dashboard ของฉัน
                                </Link>
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

                        <hr style={{ width: "100%", borderColor: "var(--color-border)" }} />
                        <Link to="/contact" onClick={() => setDrawerOpen(false)}>
                            ติดต่อเรา
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}