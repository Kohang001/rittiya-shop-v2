// src/pages/admin/AdminShopsPage.jsx — อัปเดต: โชว์จำนวนสินค้ารอตรวจของแต่ละร้านในหน้า list เลย
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllShopsForAdmin, getAllProducts } from "../../firebase/firestore";

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
        load();
    }, []);

    async function load() {
        setLoading(true);
        const shopsData = await getAllShopsForAdmin();

        // เช็คจำนวนสินค้าที่ยัง pending อยู่ของแต่ละร้าน (แม้ร้านจะ approved แล้วก็ตาม)
        const shopsWithPendingCount = await Promise.all(
            shopsData.map(async (shop) => {
                const products = await getAllProducts(shop.id);
                const pendingCount = products.filter((p) => p.status === "pending").length;
                return { ...shop, pendingProductCount: pendingCount };
            })
        );

        setShops(shopsWithPendingCount);
        setLoading(false);
    }

    const filteredShops =
        filter === "all"
            ? shops
            : filter === "needsReview"
                ? shops.filter((s) => s.status === "pending" || s.pendingProductCount > 0)
                : shops.filter((s) => s.status === filter);

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;

    return (
        <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
            <h2>จัดการร้านค้าทั้งหมด</h2>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <button
                    onClick={() => setFilter("needsReview")}
                    style={{ fontWeight: filter === "needsReview" ? "bold" : "normal" }}
                >
                    🔔 ต้องตรวจสอบ
                </button>
                {["pending", "approved", "rejected", "all"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{ fontWeight: filter === f ? "bold" : "normal" }}
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
                                    alignItems: "center",
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
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {shop.pendingProductCount > 0 && (
                                        <span
                                            style={{
                                                background: "#c00",
                                                color: "#fff",
                                                borderRadius: 999,
                                                fontSize: 12,
                                                padding: "2px 8px",
                                            }}
                                        >
                                            {shop.pendingProductCount} สินค้าใหม่
                                        </span>
                                    )}
                                    <span style={{ color: info.color }}>{info.text}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}