// src/pages/public/SearchPage.jsx — Mobile-First + Vector Iconography
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getAllApprovedProductsGlobal, getApprovedShops } from "../../firebase/firestore";
import { formatCurrency } from "../../utils/formatCurrency";
import ProductCardSkeleton from "../../components/shop/ProductCardSkeleton";
import Icon from "../../components/ui/Icon";

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [inputValue, setInputValue] = useState(initialQuery);
    const [products, setProducts] = useState([]);
    const [shopNameById, setShopNameById] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const productsData = await getAllApprovedProductsGlobal();
                setProducts(productsData);
            } catch (err) {
                console.error("โหลดสินค้าไม่สำเร็จ:", err);
            }
            try {
                const shopsData = await getApprovedShops();
                const map = {};
                shopsData.forEach((s) => (map[s.id] = s.name));
                setShopNameById(map);
            } catch (err) {
                console.error("โหลดชื่อร้านค้าไม่สำเร็จ:", err);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const query = searchParams.get("q") || "";

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const lower = query.toLowerCase();
        return products.filter(
            (p) =>
                p.name?.toLowerCase().includes(lower) ||
                (p.desc && p.desc.toLowerCase().includes(lower))
        );
    }, [products, query]);

    function handleSubmit(e) {
        e.preventDefault();
        setSearchParams(inputValue ? { q: inputValue } : {});
    }

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px" }}>
            <h1 style={{ fontSize: "clamp(20px, 5vw, 28px)", marginBottom: 16 }}>ค้นหาสินค้า</h1>

            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24, maxWidth: 540 }}>
                <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                    <Icon
                        name="search"
                        size={16}
                        color="var(--color-text-muted)"
                        style={{ position: "absolute", left: 12, pointerEvents: "none" }}
                    />
                    <input
                        type="text"
                        placeholder="พิมพ์ชื่อสินค้า เช่น ขนม, ปากกา, สมุด..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={{ width: "100%", paddingLeft: 36 }}
                        autoFocus
                    />
                </div>
                <button type="submit" style={{ minWidth: 80, justifyContent: "center" }}>
                    ค้นหา
                </button>
            </form>

            {!query.trim() ? (
                <div
                    className="card"
                    style={{
                        padding: "36px 16px",
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <Icon name="search" size={32} color="var(--color-border)" />
                    <p style={{ margin: 0, fontSize: 14 }}>พิมพ์คำค้นหาแล้วกดค้นหา เพื่อดูสินค้าจากทุกร้านค้าในโรงเรียน</p>
                </div>
            ) : loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))", gap: 12 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div
                    className="card"
                    style={{
                        padding: "40px 16px",
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <Icon name="box" size={36} color="var(--color-border)" />
                    <p style={{ margin: 0, fontSize: 14 }}>
                        ไม่พบสินค้าที่ตรงกับคำว่า "<strong>{query}</strong>"
                    </p>
                    <p style={{ margin: 0, fontSize: 12 }}>ลองค้นหาด้วยคำสั้นๆ หรือตรวจสอบตัวสะกด</p>
                </div>
            ) : (
                <>
                    <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 14 }}>
                        ผลการค้นหาสำหรับ "{query}": พบ {results.length} รายการ
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))", gap: 12 }}>
                        {results.map((product) => (
                            <Link
                                key={`${product.shopId}-${product.id}`}
                                to={`/shop/${product.shopId}`}
                                className="card spring-card"
                                style={{ overflow: "hidden", color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column" }}
                            >
                                <div style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--color-bg-subtle)" }}>
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            loading="lazy"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "var(--color-text-muted)",
                                                fontSize: 12,
                                            }}
                                        >
                                            <Icon name="box" size={28} color="var(--color-border)" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                                    <div>
                                        <p style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{product.name}</p>
                                        <p style={{ margin: "0 0 6px 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                                            ร้าน {shopNameById[product.shopId] || "ไม่ระบุ"}
                                        </p>
                                    </div>
                                    <strong style={{ fontSize: 14, color: "var(--color-primary)" }}>{formatCurrency(product.price)}</strong>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
