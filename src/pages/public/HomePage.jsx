// src/pages/public/HomePage.jsx
import { useEffect, useMemo, useState } from "react";
import { getApprovedShops } from "../../firebase/firestore";
import ShopCard from "../../components/shop/ShopCard";

export default function HomePage() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

    useEffect(() => {
        getApprovedShops()
            .then(setShops)
            .catch((err) => console.error("โหลดร้านค้าไม่สำเร็จ:", err))
            .finally(() => setLoading(false));
    }, []);

    const categories = useMemo(() => {
        const set = new Set(shops.map((s) => s.category).filter(Boolean));
        return ["ทั้งหมด", ...Array.from(set)];
    }, [shops]);

    const filteredShops = useMemo(() => {
        return shops.filter((shop) => {
            const matchCategory =
                selectedCategory === "ทั้งหมด" || shop.category === selectedCategory;
            const matchSearch = shop.name
                .toLowerCase()
                .includes(searchText.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [shops, searchText, selectedCategory]);

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
            <h1 style={{ marginBottom: 16 }}>ร้านค้าทั้งหมด</h1>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 20,
                }}
            >
                <input
                    type="text"
                    placeholder="ค้นหาชื่อร้าน..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                        flex: "1 1 200px",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                    }}
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {filteredShops.length === 0 ? (
                <p style={{ color: "#888" }}>ไม่พบร้านค้าที่ตรงกับเงื่อนไข</p>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: 16,
                    }}
                >
                    {filteredShops.map((shop) => (
                        <ShopCard key={shop.id} shop={shop} />
                    ))}
                </div>
            )}
        </div>
    );
}