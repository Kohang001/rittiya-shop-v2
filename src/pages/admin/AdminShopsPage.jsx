// src/pages/admin/AdminShopsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllShopsForAdmin } from "../../firebase/firestore";

const STATUS_LABEL = {
    pending: { text: "รอตรวจสอบ", color: "#a60" },
    approved: { text: "อนุมัติแล้ว", color: "#080" },
    rejected: { text: "ไม่อนุมัติ", color: "#c00" },
};

export default function AdminShopsPage() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        getAllShopsForAdmin()
            .then(setShops)
            .finally(() => setLoading(false));
    }, []);

    const filteredShops =
        filter === "all" ? shops : shops.filter((s) => s.status === filter);

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;

    return (
        <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
            <h2>จัดการร้านค้าทั้งหมด</h2>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["pending", "approved", "rejected", "all"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            fontWeight: filter === f ? "bold" : "normal",
                            textDecoration: filter === f ? "underline" : "none",
                        }}
                    >
                        {f === "all" ? "ทั้งหมด" : STATUS_LABEL[f].text}
                    </button>
                ))}
            </div>

            {filteredShops.length === 0 ? (
                <p style={{ color: "#888" }}>ไม่มีร้านในหมวดนี้</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredShops.map((shop) => {
                        const info = STATUS_LABEL[shop.status] || { text: shop.status, color: "#666" };
                        return (
                            <Link
                                key={shop.id}
                                to={`/admin/shops/${shop.id}`}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 12,
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                <div>
                                    <strong>{shop.name}</strong>
                                    <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{shop.phone}</p>
                                </div>
                                <span style={{ color: info.color }}>{info.text}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}