// src/pages/admin/AdminShopsPage.jsx
// ศูนย์ข้อมูลร้านค้าทั้งหมดสำหรับผู้ดูแลระบบ (Shop Directory & Operational Details)
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllShopsForAdmin, getAllProducts } from "../../firebase/firestore";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";

export default function AdminShopsPage() {
    const { isSuperAdmin } = useAuth();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const shopsData = await getAllShopsForAdmin();
                const shopsWithProductCount = await Promise.all(
                    shopsData.map(async (shop) => {
                        const products = await getAllProducts(shop.id);
                        return { ...shop, productCount: products.length };
                    })
                );
                setShops(shopsWithProductCount);
            } catch (err) {
                console.error("Failed to load shops for admin:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // รายการหมวดหมู่ทั้งหมดที่มีในระบบ
    const categories = useMemo(() => {
        const set = new Set();
        shops.forEach((s) => {
            if (s.category?.trim()) set.add(s.category.trim());
        });
        return ["all", ...Array.from(set)];
    }, [shops]);

    // กรองร้านค้าตามข้อความค้นหาและหมวดหมู่
    const filteredShops = useMemo(() => {
        return shops.filter((shop) => {
            const matchesCategory =
                selectedCategory === "all" || shop.category?.trim() === selectedCategory;

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                shop.name?.toLowerCase().includes(q) ||
                shop.phone?.includes(q) ||
                shop.category?.toLowerCase().includes(q) ||
                shop.promptpayId?.includes(q) ||
                shop.bankAccountNumber?.includes(q) ||
                shop.bankAccountName?.toLowerCase().includes(q);

            return matchesCategory && matchesSearch;
        });
    }, [shops, searchQuery, selectedCategory]);

    return (
        <div>
            <AdminNav />

            <main style={{ maxWidth: 1040, margin: "32px auto", padding: "0 16px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 26px)", fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                            ร้านค้าทั้งหมดในระบบ ({shops.length})
                        </h1>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)" }}>
                            ข้อมูลร้านค้าที่เปิดเผยได้ วิธีรับเงิน ช่องทางติดต่อ และสถานะการเปิดร้าน
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="pulse-dot pulse-dot--success" /> อนุมัติผ่านระบบอัตโนมัติ
                        </span>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        marginBottom: 24,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <div style={{ position: "relative", flex: "1 1 280px" }}>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาชื่อร้าน, เบอร์โทร, พร้อมเพย์, บัญชีธนาคาร..."
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

                    {/* Category Filter Pills */}
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            overflowX: "auto",
                            maxWidth: "100%",
                            paddingBottom: 4,
                        }}
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: 12,
                                    fontWeight: selectedCategory === cat ? 600 : 500,
                                    background: selectedCategory === cat ? "var(--color-primary)" : "var(--color-bg-subtle)",
                                    color: selectedCategory === cat ? "#ffffff" : "var(--color-text-muted)",
                                    border: selectedCategory === cat ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {cat === "all" ? "ทุกหมวดหมู่" : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shop Cards Grid */}
                {loading ? (
                    <PageSkeleton lines={6} />
                ) : filteredShops.length === 0 ? (
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
                        <Icon name="store" size={36} color="var(--color-text-muted)" />
                        <p style={{ margin: "10px 0 0 0", fontSize: 15, fontWeight: 500 }}>
                            ไม่พบร้านค้าที่ตรงกับเงื่อนไขการค้นหา
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                        {filteredShops.map((shop) => {
                            const isSuspended = shop.status === "rejected";
                            const isOpen = shop.isOpen !== false && !isSuspended;

                            return (
                                <div
                                    key={shop.id}
                                    className="card"
                                    style={{
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-md)",
                                        padding: 18,
                                        background: "var(--color-bg-surface)",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        transition: "transform 0.15s ease, border-color 0.15s ease",
                                    }}
                                >
                                    <div>
                                        {/* Shop Header */}
                                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                                            {shop.logoUrl ? (
                                                <img
                                                    src={shop.logoUrl}
                                                    alt={shop.name}
                                                    style={{ width: 50, height: 50, borderRadius: "var(--radius-sm)", objectFit: "cover", flexShrink: 0 }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 50,
                                                        height: 50,
                                                        borderRadius: "var(--radius-sm)",
                                                        background: "var(--color-bg-subtle)",
                                                        border: "1px solid var(--color-border)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: 700,
                                                        fontSize: 18,
                                                        color: "var(--color-primary)",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {shop.name ? shop.name.charAt(0).toUpperCase() : "S"}
                                                </div>
                                            )}

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {shop.name}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            padding: "2px 6px",
                                                            borderRadius: "var(--radius-sm)",
                                                            background: "var(--color-bg-subtle)",
                                                            color: "var(--color-text-muted)",
                                                            border: "1px solid var(--color-border)",
                                                        }}
                                                    >
                                                        {shop.category || "ทั่วไป"}
                                                    </span>
                                                </div>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 12,
                                                        color: "var(--color-text-muted)",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {shop.slogan || "ไม่มีสโลแกน"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status & Catalog Count */}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "8px 10px",
                                                background: "var(--color-bg-subtle)",
                                                borderRadius: "var(--radius-sm)",
                                                fontSize: 12,
                                                marginBottom: 12,
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span className={`pulse-dot pulse-dot--${isSuspended ? "rejected" : isOpen ? "success" : "warning"}`} />
                                                <span style={{ fontWeight: 500 }}>
                                                    {isSuspended ? "ถูกระงับโดยแอดมิน" : isOpen ? "เปิดรับออเดอร์" : "ปิดชั่วคราว"}
                                                </span>
                                            </div>
                                            <span style={{ color: "var(--color-text-muted)" }}>
                                                {shop.productCount || 0} รายการสินค้า
                                            </span>
                                        </div>

                                        {/* Disclosed Contact & Payment Info */}
                                        <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <Icon name="phone" size={13} color="var(--color-text-muted)" />
                                                <span>เบอร์โทร: <strong style={{ color: "var(--color-text)" }}>{shop.phone}</strong></span>
                                            </div>

                                            {shop.ig && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Icon name="instagram" size={13} color="var(--color-text-muted)" />
                                                    <span>IG: <strong style={{ color: "var(--color-text)" }}>@{shop.ig.replace("@", "")}</strong></span>
                                                </div>
                                            )}

                                            {isSuperAdmin ? (
                                                <>
                                                    {shop.promptpayId && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <Icon name="receipt" size={13} color="var(--color-text-muted)" />
                                                            <span>พร้อมเพย์: <strong style={{ color: "var(--color-text)" }}>{shop.promptpayId}</strong></span>
                                                        </div>
                                                    )}

                                                    {shop.bankName && shop.bankAccountNumber && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <Icon name="verified-shield" size={13} color="var(--color-text-muted)" />
                                                            <span>
                                                                ธนาคาร: <strong style={{ color: "var(--color-text)" }}>{shop.bankName}</strong> {shop.bankAccountNumber} ({shop.bankAccountName || "-"})
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        padding: "4px 8px",
                                                        background: "var(--color-bg-subtle)",
                                                        borderRadius: "var(--radius-sm)",
                                                        border: "1px solid var(--color-border)",
                                                        color: "var(--color-text-muted)",
                                                        fontSize: 11,
                                                        fontStyle: "italic",
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    <Icon name="lock" size={12} color="var(--color-text-muted)" />
                                                    <span>ข้อมูลการเงินจำกัดสิทธิ์เฉพาะ Super Admin</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                                        <Link
                                            to={`/admin/shops/${shop.id}`}
                                            style={{
                                                flex: 1,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 6,
                                                padding: "8px 12px",
                                                background: "var(--color-bg-subtle)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "var(--radius-sm)",
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "var(--color-text)",
                                                textDecoration: "none",
                                            }}
                                        >
                                            <Icon name="settings" size={14} /> รายละเอียด
                                        </Link>
                                        <Link
                                            to={`/shop/${shop.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 4,
                                                padding: "8px 12px",
                                                background: "transparent",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "var(--radius-sm)",
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: "var(--color-primary)",
                                                textDecoration: "none",
                                            }}
                                        >
                                            <Icon name="eye" size={14} color="var(--color-primary)" /> ดูหน้าร้าน
                                        </Link>
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
