// src/pages/public/HomePage.jsx — อัปเดต: Hero Section + Skeleton Loader
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApprovedShops } from "../../firebase/firestore";
import ShopCard from "../../components/shop/ShopCard";
import ShopCardSkeleton from "../../components/shop/ShopCardSkeleton";

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [productSearchText, setProductSearchText] = useState("");
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
            const matchCategory = selectedCategory === "ทั้งหมด" || shop.category === selectedCategory;
            const matchSearch = shop.name.toLowerCase().includes(searchText.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [shops, searchText, selectedCategory]);

    function clearSearch() {
        setSearchText("");
        setSelectedCategory("ทั้งหมด");
    }

    return (
        <div>
            <section className="hero-section">
                <h1 className="hero-title">ตลาดออนไลน์ รวมร้านค้าจากชาว Rittiya</h1>
                <p className="hero-subtitle">สั่งซื้อสินค้าจากเพื่อนๆ ในโรงเรียนได้ง่ายๆ ในที่เดียว</p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (productSearchText.trim()) navigate(`/search?q=${encodeURIComponent(productSearchText)}`);
                    }}
                    style={{ display: "flex", gap: 8, maxWidth: 420, margin: "0 auto 20px" }}
                >
                    <input
                        type="text"
                        placeholder="ค้นหาสินค้าจากทุกร้าน..."
                        value={productSearchText}
                        onChange={(e) => setProductSearchText(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit">ค้นหา</button>
                </form>
                <div className="hero-actions">
                    <a href="#shop-list">
                        <button type="submit">สำรวจร้านค้า</button>
                    </a>
                    {!user && (
                        <Link to="/seller/register">
                            <button type="button">สมัครเป็นผู้ขาย</button>
                        </Link>
                    )}
                </div>
            </section>

            <div id="shop-list" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
                <h2 style={{ marginBottom: 16 }}>ร้านค้าทั้งหมด</h2>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อร้าน..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ flex: "1 1 200px" }}
                    />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: 16,
                        }}
                    >
                        {Array.from({ length: 8 }).map((_, i) => (
                            <ShopCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredShops.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
                        <p>ไม่พบร้านค้าที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหาดู</p>
                        <button type="button" onClick={clearSearch}>
                            ล้างการค้นหา
                        </button>
                    </div>
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
        </div>
    );
}