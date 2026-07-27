// src/components/ui/Breadcrumb.jsx
import { Link } from "react-router-dom";

/**
 * ตัวอย่าง: <Breadcrumb items={[{ label: "ร้านค้า", to: "/" }, { label: shop.name }]} />
 * item สุดท้ายไม่ต้องใส่ "to" — จะถูก render เป็นข้อความปัจจุบัน ไม่ใช่ลิงก์
 */
export default function Breadcrumb({ items }) {
    return (
        <nav className="breadcrumb" aria-label="breadcrumb">
            {items.map((item, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i > 0 && <span aria-hidden="true">/</span>}
                    {item.to ? (
                        <Link to={item.to}>{item.label}</Link>
                    ) : (
                        <span className="breadcrumb-current">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}