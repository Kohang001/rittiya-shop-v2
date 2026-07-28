// src/pages/public/SearchPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getAllApprovedProductsGlobal, getAllShopsForAdmin } from "../../firebase/firestore";
import { formatCurrency } from "../../utils/formatCurrency";
import ProductCardSkeleton from "../../components/shop/ProductCardSkeleton";

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [inputValue, setInputValue] = useState(initialQuery);
    const [products, setProducts] = useState([]);
    const [shopNameById, setShopNameById] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getAllApprovedProductsGlobal(), getAllShopsForAdmin()])
            .then(([productsData, shopsData]) => {
                setProducts(productsData);
                const map = {};
                shopsData.forEach((s) => (map[s.id] = s.name));
                setShopNameById(map);
            })
            .catch((err) => console.error("โหลดสินค้าไม่สำเร็จ:", err))
            .finally(() => setLoading(false));
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
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
            <h1 style={{ marginBottom: 16 }}>ค้นหาสินค้า</h1>

            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                <input
                    type="text"
                    placeholder="พิมพ์ชื่อสินค้าที่ต้องการหา..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                />
                <button type="submit">ค้นหา</button>
            </form>

            {!query.trim() ? (
                <p style={{ color: "var(--color-text-muted)" }}>พิมพ์คำค้นหาแล้วกดค้นหา เพื่อดูสินค้าจากทุกร้าน</p>
            ) : loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>
                    ไม่พบสินค้าที่ตรงกับ "{query}" ลองใช้คำค้นหาอื่นดู
                </p>
            ) : (
                <>
                    <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 12 }}>
                        พบ {results.length} รายการ
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                        {results.map((product) => (
                            <Link
                                key={`${product.shopId}-${product.id}`}
                                to={`/shop/${product.shopId}`}
                                className="card"
                                style={{ overflow: "hidden", color: "inherit" }}
                            >
                                <div style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--color-bg-subtle)" }}>
                                    {product.imageUrl && (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    )}
                                </div>
                                <div style={{ padding: 10 }}>
                                    <p style={{ margin: "0 0 4px 0", fontSize: 14 }}>{product.name}</p>
                                    <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                                        {shopNameById[product.shopId] || "ร้านค้า"}
                                    </p>
                                    <strong style={{ fontSize: 14 }}>{formatCurrency(product.price)}</strong>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}