// src/components/layout/AdminNav.jsx
// แถบเมนูนำทางสำหรับผู้ดูแลระบบ (Operations & Management Navigation)
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../ui/Icon";

const BASE_LINKS = [
    { to: "/admin", label: "ภาพรวม & กิจกรรม", icon: "sparkle", end: true },
    { to: "/admin/shops", label: "ร้านค้าทั้งหมด", icon: "store" },
    { to: "/admin/products", label: "สินค้าทั้งหมด", icon: "box" },
    { to: "/admin/orders", label: "ออเดอร์ทั้งหมด", icon: "receipt" },
    { to: "/admin/feed", label: "ประกาศข่าวสาร", icon: "megaphone" },
];

export default function AdminNav() {
    const { isSuperAdmin } = useAuth();

    const links = [
        ...BASE_LINKS,
        {
            to: "/admin/roles",
            label: isSuperAdmin ? "จัดการสิทธิ์ & LINE" : "LINE แอดมิน",
            icon: "shield",
        },
    ];

    return (
        <nav
            aria-label="Admin Navigation"
            style={{
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-surface)",
                position: "sticky",
                top: 0,
                zIndex: 40,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
            }}
        >
            <div
                style={{
                    maxWidth: 1040,
                    margin: "0 auto",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                }}
            >
                <div
                    style={{
                        padding: "4px 8px",
                        marginRight: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                        borderRight: "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span className={`pulse-dot pulse-dot--${isSuperAdmin ? "success" : "info"}`} />
                    <span>{isSuperAdmin ? "Super Admin" : "Normal Admin"}</span>
                </div>

                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        style={({ isActive }) => ({
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 13px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#ffffff" : "var(--color-text-muted)",
                            background: isActive ? "var(--color-primary)" : "transparent",
                            textDecoration: "none",
                            transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                            minHeight: 36,
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    name={link.icon}
                                    size={15}
                                    color={isActive ? "#ffffff" : "var(--color-text-muted)"}
                                />
                                <span>{link.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
