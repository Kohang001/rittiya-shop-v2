// src/components/layout/AdminNav.jsx
// เมนูเล็กๆ เชื่อมระหว่าง 3 หน้า Admin — ไม่โผล่ใน Navbar หลัก ใช้แค่ภายในโซน Admin เท่านั้น
import { NavLink } from "react-router-dom";

const LINKS = [
    { to: "/admin/shops", label: "ร้านค้า" },
    { to: "/admin/products", label: "สินค้ารอตรวจสอบ" },
    { to: "/admin/orders", label: "ออเดอร์ทั้งหมด" },
];

export default function AdminNav() {
    return (
        <div
            style={{
                display: "flex",
                gap: 4,
                padding: "10px 16px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-subtle)",
            }}
        >
            {LINKS.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    style={({ isActive }) => ({
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                        textDecoration: "none",
                    })}
                >
                    {link.label}
                </NavLink>
            ))}
        </div>
    );
}