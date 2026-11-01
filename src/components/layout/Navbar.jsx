// src/components/layout/Navbar.jsx — Header เรียบเสมอทุกขนาดจอ + รองรับสมาชิกทั่วไปและร้านค้า
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../firebase/auth";
import Icon from "../ui/Icon";

export default function Navbar() {
    const { user, userProfile, isAdmin } = useAuth();
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
                background: "var(--color-bg)",
                position: "sticky",
                top: 0,
                zIndex: 30,
            }}
        >
            <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text)", textDecoration: "none" }}>
                Rittiya Shop
            </Link>

            {/* Header หลัก — เรียบเสมอทุกขนาดจอ */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Link to="/">ร้านค้า</Link>
                <Link to="/feed">ประกาศ</Link>
                <button
                    onClick={() => setDrawerOpen(true)}
                    aria-label="เปิดเมนู"
                    style={{ border: "none", background: "transparent", padding: 6, cursor: "pointer" }}
                >
                    <Icon name="menu" size={22} />
                </button>
            </div>

            {/* Drawer — เมนูบัญชีผู้ใช้ */}
            {drawerOpen && (
                <div className="navbar-drawer" onClick={() => setDrawerOpen(false)}>
                    <div className="navbar-drawer-panel" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setDrawerOpen(false)}
                            aria-label="ปิดเมนู"
                            style={{ alignSelf: "flex-end", border: "none", background: "transparent", padding: 6, cursor: "pointer" }}
                        >
                            <Icon name="x" size={20} />
                        </button>

                        {user ? (
                            <>
                                <div style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", marginBottom: 4 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                                        {userProfile?.displayName || user.displayName || "ผู้ใช้งาน"}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {user.email}
                                    </div>
                                </div>

                                <Link to="/profile" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Icon name="user" size={16} /> ข้อมูลส่วนตัว & จุดนัดรับ
                                </Link>

                                <Link to="/seller/dashboard" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Icon name="store" size={16} /> จัดการร้านค้าของฉัน
                                </Link>

                                {isAdmin && (
                                    <Link to="/admin" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)", fontWeight: 600 }}>
                                        <Icon name="shield" size={16} color="var(--color-primary)" /> แดชบอร์ดผู้ดูแลระบบ
                                    </Link>
                                )}

                                <button onClick={handleLogout} style={{ marginTop: 8 }}>
                                    <Icon name="log-out" size={16} /> ออกจากระบบ
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Icon name="user" size={16} /> เข้าสู่ระบบ
                                </Link>
                                <Link to="/register" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)", fontWeight: 600 }}>
                                    <Icon name="sparkle" size={16} color="var(--color-primary)" /> สมัครสมาชิกทั่วไป (ผู้ซื้อ)
                                </Link>
                                <Link to="/seller/register" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Icon name="store" size={16} /> สมัครเปิดร้านค้า (แม่ค้า)
                                </Link>
                            </>
                        )}

                        <hr style={{ width: "100%", borderColor: "var(--color-border)", margin: "8px 0" }} />
                        <Link to="/contact" onClick={() => setDrawerOpen(false)}>
                            ติดต่อเรา
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
