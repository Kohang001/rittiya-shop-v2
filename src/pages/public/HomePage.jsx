// src/pages/public/HomePage.jsx — อัปเดต Mobile-First + Zero-Emoji + Vector Iconography
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApprovedShops } from "../../firebase/firestore";
import ShopCard from "../../components/shop/ShopCard";
import ShopCardSkeleton from "../../components/shop/ShopCardSkeleton";
import Icon from "../../components/ui/Icon";

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
                <div style={{ display: "inline-flex", marginBottom: 14 }}>
                    <span
                        className="status-pill status-pill--open"
                        style={{ background: "#ffffff", border: "1px solid var(--color-border)", padding: "4px 12px" }}
                    >
                        <Icon name="sparkle" size={13} color="var(--color-primary)" />
                        <span>ศูนย์รวมร้านค้าและสินค้าชาว Rittiya</span>
                    </span>
                </div>

                <h1 className="hero-title" style={{ fontSize: "clamp(22px, 5.5vw, 34px)" }}>
                    ตลาดออนไลน์ รวมร้านค้าจากเพื่อนๆ
                </h1>
                <p className="hero-subtitle" style={{ fontSize: "clamp(13px, 3.5vw, 15px)", maxWidth: 500, margin: "0 auto 24px" }}>
                    เลือกช้อปสินค้า ขนม อุปกรณ์การเรียน และของใช้ได้ง่าย สะดวก รวดเร็ว
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (productSearchText.trim()) navigate(`/search?q=${encodeURIComponent(productSearchText)}`);
                    }}
                    style={{
                        display: "flex",
                        gap: 8,
                        maxWidth: 440,
                        margin: "0 auto 20px",
                        width: "100%",
                        padding: "0 8px",
                    }}
                >
                    <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                        <Icon
                            name="search"
                            size={16}
                            color="var(--color-text-muted)"
                            style={{ position: "absolute", left: 12, pointerEvents: "none" }}
                        />
                        <input
                            type="text"
                            placeholder="ค้นหาสินค้าจากทุกร้าน..."
                            value={productSearchText}
                            onChange={(e) => setProductSearchText(e.target.value)}
                            style={{ width: "100%", paddingLeft: 36 }}
                        />
                    </div>
                    <button type="submit" style={{ minWidth: 80, justifyContent: "center" }}>
                        ค้นหา
                    </button>
                </form>

                <div className="hero-actions">
                    <a href="#shop-list">
                        <button type="submit">
                            <Icon name="store" size={16} /> สำรวจร้านค้า
                        </button>
                    </a>
                    {!user && (
                        <Link to="/seller/register">
                            <button type="button">
                                <Icon name="plus" size={16} /> สมัครเป็นผู้ขาย
                            </button>
                        </Link>
                    )}
                </div>
            </section>

            <div id="shop-list" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <h2 style={{ margin: 0, fontSize: "clamp(18px, 4.5vw, 22px)" }}>ร้านค้าทั้งหมด</h2>
                    <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        พบ {filteredShops.length} ร้าน
                    </span>
                </div>

                {/* Touch horizontal category chips for mobile */}
                <div className="category-touch-scroll" style={{ marginBottom: 16 }}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: "6px 14px",
                                fontSize: 13,
                                borderRadius: 9999,
                                whiteSpace: "nowrap",
                                border: selectedCategory === cat ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                background: selectedCategory === cat ? "var(--color-primary)" : "var(--color-bg)",
                                color: selectedCategory === cat ? "#ffffff" : "var(--color-text)",
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search bar inside shop section */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ position: "relative", maxWidth: 360, display: "flex", alignItems: "center" }}>
                        <Icon
                            name="search"
                            size={14}
                            color="var(--color-text-muted)"
                            style={{ position: "absolute", left: 10, pointerEvents: "none" }}
                        />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อร้านค้า..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: "100%", paddingLeft: 32 }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
                            gap: 12,
                        }}
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ShopCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredShops.length === 0 ? (
                    <div
                        className="card"
                        style={{
                            textAlign: "center",
                            padding: "48px 16px",
                            color: "var(--color-text-muted)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <Icon name="search" size={36} color="var(--color-border)" />
                        <p style={{ margin: 0, fontSize: 14 }}>ไม่พบร้านค้าที่ตรงกับเงื่อนไข</p>
                        <button type="button" onClick={clearSearch}>
                            ล้างการค้นหา
                        </button>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
                            gap: 12,
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
