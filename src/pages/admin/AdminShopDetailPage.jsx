// src/pages/admin/AdminShopDetailPage.jsx — อัปเดต: Breadcrumb + Toast แทน alert()
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopById, getAllProducts } from "../../firebase/firestore";
import Icon from "../../components/ui/Icon";
import Breadcrumb from "../../components/ui/Breadcrumb";
import AdminNav from "../../components/layout/AdminNav";
import PageSkeleton from "../../components/ui/PageSkeleton";

const STATUS_LABEL = {
    pending: { text: "รอตรวจสอบ", color: "var(--color-status-pending)" },
    approved: { text: "อนุมัติแล้ว", color: "var(--color-status-approved)" },
    rejected: { text: "ไม่อนุมัติ", color: "var(--color-status-rejected)" },
};

export default function AdminShopDetailPage() {
    const { shopId } = useParams();
    const { user } = useAuth();
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
        const [shopData, productsData] = await Promise.all([
            getShopById(shopId),
            getAllProducts(shopId),
        ]);
        setShop(shopData);
        setProducts(productsData);
        setLoading(false);
    }

    async function callApi(url, body) {
        const idToken = await user.getIdToken();
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
        return data;
    }

    async function handleShopAction(action) {
        let reason = "";
        if (action === "reject") reason = prompt("เหตุผลที่ไม่อนุมัติ:") || "";
        setBusy(true);
        try {
            await callApi("/api/approveShop", { shopId, action, reason });
            showToast(action === "approve" ? "อนุมัติร้านสำเร็จ" : "ปฏิเสธร้านแล้ว", "success");
            await load();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setBusy(false);
        }
    }

    async function handleProductAction(productId, action) {
        let reason = "";
        if (action === "reject") reason = prompt("เหตุผลที่ไม่อนุมัติสินค้านี้:") || "";
        setBusy(true);
        try {
            await callApi("/api/approveProduct", { shopId, productId, action, reason });
            showToast(action === "approve" ? "อนุมัติสินค้าสำเร็จ" : "ปฏิเสธสินค้าแล้ว", "success");
            await load();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <PageSkeleton lines={6} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    const shopStatusInfo = STATUS_LABEL[shop.status] || { text: shop.status, color: "var(--color-text-muted)" };

    return (
        <div>
            <AdminNav />
            <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
                <Breadcrumb
                    items={[
                        { label: "รายชื่อร้าน", to: "/admin/shops" },
                        { label: shop.name },
                    ]}
                />

                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    {shop.logoUrl && (
                        <img src={shop.logoUrl} alt={shop.name} style={{ width: 70, height: 70, borderRadius: 10, objectFit: "cover" }} />
                    )}
                    <div>
                        <h2 style={{ margin: 0 }}>{shop.name}</h2>
                        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{shop.slogan}</p>
                    </div>
                </div>

                <div style={{ margin: "16px 0", fontSize: 14 }}>
                    <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="phone" size={16} /> {shop.phone}
                        {shop.ig && (
                            <>
                                <Icon name="instagram" size={16} style={{ marginLeft: 12 }} /> @{shop.ig}
                            </>
                        )}
                    </p>
                    <p>หมวดหมู่: {shop.category || "-"}</p>
                    <p>
                        สถานะ: <strong style={{ color: shopStatusInfo.color }}>{shopStatusInfo.text}</strong>
                    </p>
                    {shop.rejectReason && <p style={{ color: "var(--color-danger)" }}>เหตุผลไม่อนุมัติ: {shop.rejectReason}</p>}
                </div>

                {shop.status !== "approved" && (
                    <button disabled={busy} onClick={() => handleShopAction("approve")}>
                        <Icon name="check" size={16} /> อนุมัติร้านนี้
                    </button>
                )}
                {shop.status !== "rejected" && (
                    <button disabled={busy} onClick={() => handleShopAction("reject")} style={{ marginLeft: 8 }}>
                        <Icon name="x" size={16} /> ไม่อนุมัติร้านนี้
                    </button>
                )}

                <h3 style={{ marginTop: 30 }}>สินค้า ({products.length})</h3>
                {products.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)" }}>ยังไม่มีสินค้า</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {products.map((product) => {
                            const info = STATUS_LABEL[product.status] || { text: product.status, color: "var(--color-text-muted)" };
                            return (
                                <div
                                    key={product.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: 8,
                                        padding: 10,
                                    }}
                                >
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        {product.imageUrl && (
                                            <img src={product.imageUrl} alt={product.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} />
                                        )}
                                        <div>
                                            <p style={{ margin: 0 }}>{product.name}</p>
                                            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                                                {product.price?.toLocaleString()} บาท · <span style={{ color: info.color }}>{info.text}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {product.status !== "approved" && (
                                            <button disabled={busy} onClick={() => handleProductAction(product.id, "approve")}>
                                                <Icon name="check" size={14} /> อนุมัติ
                                            </button>
                                        )}
                                        {product.status !== "rejected" && (
                                            <button disabled={busy} onClick={() => handleProductAction(product.id, "reject")}>
                                                <Icon name="x" size={14} /> ไม่อนุมัติ
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}