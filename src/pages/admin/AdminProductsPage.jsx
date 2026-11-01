// src/pages/admin/AdminProductsPage.jsx
// แคตตาล็อกสินค้าทั้งหมดในระบบสำหรับผู้ดูแลระบบ (All Products Catalog & Inventory Overview)
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getAllProductsForAdmin,
    getAllShopsForAdmin,
    hideProductByAdmin,
    unhideProductByAdmin,
} from "../../firebase/firestore";
import { useToast } from "../../context/ToastContext";
import Breadcrumb from "../../components/ui/Breadcrumb";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";
import { formatCurrency } from "../../utils/formatCurrency";

export default function AdminProductsPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [shopMap, setShopMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedShopId, setSelectedShopId] = useState("all");
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const shopsData = await getAllShopsForAdmin().catch(() => []);
            const map = {};
            shopsData.forEach((s) => {
                map[s.id] = s;
            });
            setShopMap(map);

            const productsData = await getAllProductsForAdmin().catch(() => []);
            setProducts(productsData);
        } catch (err) {
            console.error("Failed to load products for admin catalog:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleHide(product) {
        const isHidden = product.status === "rejected";
        setBusyId(product.id);
        try {
            if (isHidden) {
                await unhideProductByAdmin(product.shopId, product.id, { productName: product.name });
                showToast("ปลดซ่อนสินค้าสำเร็จ", "success");
            } else {
                const reason = prompt("กรุณาระบุเหตุผลในการซ่อนสินค้านี้:") || "สินค้าไม่เหมาะสม";
                await hideProductByAdmin(product.shopId, product.id, reason, { productName: product.name });
                showToast("ซ่อนสินค้าออกจากแคตตาล็อกแล้ว", "success");
            }
            await load();
        } catch (err) {
            showToast(err.message || "เกิดข้อผิดพลาด", "error");
        } finally {
            setBusyId(null);
        }
    }

    // กรองสินค้าตามคำค้นหาและร้านค้า
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesShop = selectedShopId === "all" || p.shopId === selectedShopId;
            const q = searchQuery.toLowerCase().trim();
            const shopName = shopMap[p.shopId]?.name || "";
            const matchesSearch =
                !q ||
                p.name?.toLowerCase().includes(q) ||
                p.desc?.toLowerCase().includes(q) ||
                shopName.toLowerCase().includes(q);

            return matchesShop && matchesSearch;
        });
    }, [products, shopMap, searchQuery, selectedShopId]);

    return (
        <div>
            <AdminNav />

            <main style={{ maxWidth: 1040, margin: "32px auto", padding: "0 16px" }}>
                <Breadcrumb items={[{ label: "ภาพรวม", to: "/admin" }, { label: "สินค้าทั้งหมด" }]} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 26px)", fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                            แคตตาล็อกสินค้าทั้งหมด ({products.length})
                        </h1>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)" }}>
                            รายการสินค้าทั้งหมดที่วางขายข้ามทุกร้านในระบบ พร้อมตรวจสอบความเหมาะสม
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-muted)" }}>
                        <Icon name="verified-shield" size={15} color="var(--color-success)" />
                        <span>ผ่านการคัดกรองคำอัตโนมัติ</span>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 280px" }}>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาชื่อสินค้า, รายละเอียด, หรือชื่อร้านค้า..."
                            style={{
                                width: "100%",
                                padding: "9px 12px 9px 36px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                fontSize: 13,
                                background: "var(--color-bg-surface)",
                            }}
                        />
                        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                            <Icon name="search" size={15} color="var(--color-text-muted)" />
                        </div>
                    </div>

                    {/* Shop selector */}
                    <div style={{ flex: "0 1 220px" }}>
                        <select
                            value={selectedShopId}
                            onChange={(e) => setSelectedShopId(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                fontSize: 13,
                                background: "var(--color-bg-surface)",
                            }}
                        >
                            <option value="all">-- ทุกร้านค้า --</option>
                            {Object.values(shopMap).map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Products List */}
                {loading ? (
                    <PageSkeleton lines={6} />
                ) : filteredProducts.length === 0 ? (
                    <div
                        style={{
                            padding: "48px 16px",
                            textAlign: "center",
                            border: "1px dashed var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            background: "var(--color-bg-subtle)",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        <Icon name="box" size={36} color="var(--color-text-muted)" />
                        <p style={{ margin: "10px 0 0 0", fontSize: 15, fontWeight: 500 }}>
                            ไม่พบสินค้าที่ตรงกับการค้นหา
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filteredProducts.map((product) => {
                            const shop = shopMap[product.shopId] || null;
                            const isHidden = product.status === "rejected";

                            return (
                                <div
                                    key={`${product.shopId}-${product.id}`}
                                    className="card"
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: 14,
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid var(--color-border)",
                                        background: isHidden ? "var(--color-status-rejected-bg)" : "var(--color-bg-surface)",
                                        flexWrap: "wrap",
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 260 }}>
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                style={{ width: 50, height: 50, objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: 50,
                                                    height: 50,
                                                    borderRadius: "var(--radius-sm)",
                                                    background: "var(--color-bg-subtle)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Icon name="box" size={24} color="var(--color-text-muted)" />
                                            </div>
                                        )}

                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <span style={{ fontWeight: 600, fontSize: 15 }}>{product.name}</span>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>
                                                    {formatCurrency(product.price)}
                                                </span>
                                            </div>
                                            <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                                                ร้าน:{" "}
                                                {shop ? (
                                                    <Link
                                                        to={`/admin/shops/${shop.id}`}
                                                        style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
                                                    >
                                                        {shop.name}
                                                    </Link>
                                                ) : (
                                                    "ไม่ทราบร้านค้า"
                                                )}
                                                {product.desc && (
                                                    <span style={{ marginLeft: 8 }}>· {product.desc}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions & Status */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                padding: "3px 8px",
                                                borderRadius: "var(--radius-sm)",
                                                background: isHidden ? "var(--color-bg-surface)" : "var(--color-status-approved-bg)",
                                                color: isHidden ? "var(--color-danger)" : "var(--color-success)",
                                                border: `1px solid ${isHidden ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)"}`,
                                            }}
                                        >
                                            {isHidden ? "ซ่อนอยู่" : "พร้อมขาย"}
                                        </span>

                                        {shop && (
                                            <Link
                                                to={`/shop/${shop.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    background: "var(--color-bg-subtle)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "var(--radius-sm)",
                                                    color: "var(--color-text)",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                <Icon name="eye" size={13} /> ดูหน้าร้าน
                                            </Link>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleToggleHide(product)}
                                            disabled={busyId === product.id}
                                            style={{
                                                padding: "6px 12px",
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: isHidden ? "var(--color-status-approved-bg)" : "var(--color-status-rejected-bg)",
                                                border: `1px solid ${isHidden ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
                                                borderRadius: "var(--radius-sm)",
                                                color: isHidden ? "var(--color-success)" : "var(--color-danger)",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {isHidden ? "ปลดซ่อนสินค้า" : "ซ่อนสินค้านี้"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
