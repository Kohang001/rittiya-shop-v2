// src/pages/admin/AdminShopDetailPage.jsx
// หน้ารายละเอียดร้านค้าและศูนย์ควบคุมความปลอดภัย (Shop Administration & Safety Controls)
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    getShopById,
    getAllProducts,
    suspendShop,
    activateShop,
    hideProductByAdmin,
    unhideProductByAdmin,
} from "../../firebase/firestore";
import Icon from "../../components/ui/Icon";
import Breadcrumb from "../../components/ui/Breadcrumb";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";
import { formatCurrency } from "../../utils/formatCurrency";

export default function AdminShopDetailPage() {
    const { shopId } = useParams();
    const { isSuperAdmin } = useAuth();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        load();
    }, [shopId]);

    async function load() {
        setLoading(true);
        try {
            const [shopData, productsData] = await Promise.all([
                getShopById(shopId),
                getAllProducts(shopId),
            ]);
            setShop(shopData);
            setProducts(productsData);
        } catch (err) {
            console.error("Error loading shop details:", err);
            showToast("ไม่สามารถโหลดข้อมูลร้านค้าได้", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleSuspend() {
        const isSuspended = shop.status === "rejected";
        setBusy(true);
        try {
            if (isSuspended) {
                await activateShop(shopId, { shopName: shop.name });
                showToast("เปิดใช้งานร้านค้าตามปกติแล้ว", "success");
            } else {
                const reason = prompt("กรุณาระบุเหตุผลในการระงับร้านค้านี้:") || "พบการละเมิดกฎเกณฑ์ชุมชน";
                await suspendShop(shopId, reason, { shopName: shop.name });
                showToast("ระงับร้านค้าชั่วคราวเรียบร้อยแล้ว", "success");
            }
            await load();
        } catch (err) {
            showToast(err.message || "เกิดข้อผิดพลาดในการปรับสถานะ", "error");
        } finally {
            setBusy(false);
        }
    }

    async function handleToggleHideProduct(product) {
        const isHidden = product.status === "rejected";
        setBusy(true);
        try {
            if (isHidden) {
                await unhideProductByAdmin(shopId, product.id, { productName: product.name });
                showToast("ปลดซ่อนสินค้าสำเร็จ", "success");
            } else {
                const reason = prompt("กรุณาระบุเหตุผลในการซ่อนสินค้านี้:") || "สินค้าไม่เหมาะสม";
                await hideProductByAdmin(shopId, product.id, reason, { productName: product.name });
                showToast("ซ่อนสินค้าออกจากหน้าร้านแล้ว", "success");
            }
            await load();
        } catch (err) {
            showToast(err.message || "เกิดข้อผิดพลาด", "error");
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div>
                <AdminNav />
                <div style={{ maxWidth: 840, margin: "32px auto", padding: "0 16px" }}>
                    <PageSkeleton lines={6} />
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div>
                <AdminNav />
                <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center", padding: "0 16px" }}>
                    <p>ไม่พบข้อมูลร้านค้าในระบบ</p>
                    <Link to="/admin/shops" className="nav-link-btn" style={{ justifyContent: "center" }}>
                        กลับสู่รายชื่อร้านค้า
                    </Link>
                </div>
            </div>
        );
    }

    const isSuspended = shop.status === "rejected";
    const isOpen = shop.isOpen !== false && !isSuspended;

    return (
        <div>
            <AdminNav />

            <main style={{ maxWidth: 840, margin: "32px auto", padding: "0 16px" }}>
                <Breadcrumb
                    items={[
                        { label: "ร้านค้าทั้งหมด", to: "/admin/shops" },
                        { label: shop.name },
                    ]}
                />

                {/* Shop Banner / Header */}
                <div
                    className="card"
                    style={{
                        padding: 24,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-surface)",
                        marginBottom: 20,
                    }}
                >
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                        {shop.logoUrl ? (
                            <img
                                src={shop.logoUrl}
                                alt={shop.name}
                                style={{ width: 68, height: 68, borderRadius: "var(--radius-md)", objectFit: "cover" }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: "var(--radius-md)",
                                    background: "var(--color-bg-subtle)",
                                    border: "1px solid var(--color-border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 24,
                                    color: "var(--color-primary)",
                                }}
                            >
                                {shop.name ? shop.name.charAt(0).toUpperCase() : "S"}
                            </div>
                        )}

                        <div style={{ flex: 1, minWidth: 240 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <h1 style={{ margin: 0, fontSize: "clamp(20px, 3.5vw, 24px)", fontWeight: 700 }}>
                                    {shop.name}
                                </h1>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        padding: "3px 8px",
                                        borderRadius: "var(--radius-sm)",
                                        background: "var(--color-bg-subtle)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    {shop.category || "ทั่วไป"}
                                </span>
                            </div>
                            <p style={{ margin: "4px 0 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
                                {shop.slogan || "ไม่มีคำอธิบาย/สโลแกน"}
                            </p>
                        </div>

                        <div>
                            <Link
                                to={`/shop/${shop.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "8px 14px",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg-subtle)",
                                    color: "var(--color-text)",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    textDecoration: "none",
                                }}
                            >
                                <Icon name="eye" size={14} /> เปิดดูหน้าร้าน
                            </Link>
                        </div>
                    </div>

                    {/* Operational Status Banner */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-sm)",
                            background: isSuspended ? "var(--color-status-rejected-bg)" : "var(--color-bg-subtle)",
                            border: `1px solid ${isSuspended ? "rgba(239, 68, 68, 0.25)" : "var(--color-border)"}`,
                            marginBottom: 16,
                            flexWrap: "wrap",
                            gap: 8,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className={`pulse-dot pulse-dot--${isSuspended ? "rejected" : isOpen ? "success" : "warning"}`} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                {isSuspended
                                    ? `ร้านค้านี้ถูกระงับโดยผู้ดูแลระบบ (เหตุผล: ${shop.rejectReason || "ไม่ระบุ"})`
                                    : isOpen
                                        ? "สถานะ: เปิดรับออเดอร์ตามปกติ"
                                        : "สถานะ: ปิดรับออเดอร์ชั่วคราว (โดยเจ้าของร้าน)"}
                            </span>
                        </div>

                        {/* Safety Override Button */}
                        <button
                            type="button"
                            onClick={handleToggleSuspend}
                            disabled={busy}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: isSuspended ? "1px solid var(--color-success)" : "1px solid rgba(239, 68, 68, 0.3)",
                                background: isSuspended ? "var(--color-status-approved-bg)" : "var(--color-status-rejected-bg)",
                                color: isSuspended ? "var(--color-success)" : "var(--color-danger)",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            <Icon name={isSuspended ? "check" : "alert"} size={13} color={isSuspended ? "var(--color-success)" : "var(--color-danger)"} />
                            {isSuspended ? "ยกเลิกการระงับ (เปิดร้าน)" : "ระงับร้านค้านี้ (ฉุกเฉิน)"}
                        </button>
                    </div>

                    {/* Contact & Payment Disclosed Details */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: 16,
                            borderTop: "1px solid var(--color-border)",
                            paddingTop: 16,
                            fontSize: 13,
                        }}
                    >
                        <div>
                            <span style={{ fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: 6 }}>
                                ช่องทางติดต่อร้านค้า:
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "var(--color-text-muted)" }}>
                                <Icon name="phone" size={14} color="var(--color-text-muted)" />
                                เบอร์โทร: <strong style={{ color: "var(--color-text)" }}>{shop.phone}</strong>
                            </div>
                            {shop.ig && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)" }}>
                                    <Icon name="instagram" size={14} color="var(--color-text-muted)" />
                                    IG: <strong style={{ color: "var(--color-text)" }}>@{shop.ig.replace("@", "")}</strong>
                                </div>
                            )}
                        </div>

                        <div>
                            <span style={{ fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: 6 }}>
                                ข้อมูลการรับเงินของร้าน:
                            </span>
                            {isSuperAdmin ? (
                                <>
                                    {shop.promptpayId ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "var(--color-text-muted)" }}>
                                            <Icon name="receipt" size={14} color="var(--color-text-muted)" />
                                            พร้อมเพย์: <strong style={{ color: "var(--color-text)" }}>{shop.promptpayId}</strong>
                                        </div>
                                    ) : null}
                                    {shop.bankName && shop.bankAccountNumber ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)" }}>
                                            <Icon name="verified-shield" size={14} color="var(--color-text-muted)" />
                                            ธนาคาร: <strong style={{ color: "var(--color-text)" }}>{shop.bankName}</strong> {shop.bankAccountNumber} ({shop.bankAccountName || "-"})
                                        </div>
                                    ) : null}
                                    {!shop.promptpayId && !shop.bankAccountNumber && (
                                        <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>ไม่มีข้อมูลการเงิน</span>
                                    )}
                                </>
                            ) : (
                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 10px",
                                        background: "var(--color-bg-subtle)",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        color: "var(--color-text-muted)",
                                        fontSize: 12,
                                        fontStyle: "italic",
                                    }}
                                >
                                    <Icon name="lock" size={13} color="var(--color-text-muted)" />
                                    <span>ข้อมูลการเงินถูกจำกัดสิทธิ์เฉพาะ Super Admin</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Shop Products Section */}
                <div style={{ marginTop: 28 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                            รายการสินค้าในร้าน ({products.length})
                        </h2>
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                            สินค้าทุกชิ้นผ่านการตรวจสอบคำอัตโนมัติ
                        </span>
                    </div>

                    {products.length === 0 ? (
                        <div
                            style={{
                                padding: "36px 16px",
                                textAlign: "center",
                                border: "1px dashed var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                background: "var(--color-bg-subtle)",
                                color: "var(--color-text-muted)",
                            }}
                        >
                            <Icon name="box" size={32} color="var(--color-text-muted)" />
                            <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>ร้านนี้ยังไม่มีสินค้า</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {products.map((product) => {
                                const isHidden = product.status === "rejected";

                                return (
                                    <div
                                        key={product.id}
                                        className="card"
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            padding: 14,
                                            background: isHidden ? "var(--color-status-rejected-bg)" : "var(--color-bg-surface)",
                                            flexWrap: "wrap",
                                            gap: 12,
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                                                    {product.name}
                                                </p>
                                                <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>
                                                    {formatCurrency(product.price)}
                                                    {product.desc && (
                                                        <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 8 }}>
                                                            · {product.desc}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

                                            {/* Safety Override Button for Item */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleHideProduct(product)}
                                                disabled={busy}
                                                style={{
                                                    padding: "6px 12px",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    background: "var(--color-bg-subtle)",
                                                    border: "1px solid var(--color-border)",
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
                </div>
            </main>
        </div>
    );
}
