// src/pages/admin/AdminProductsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getAllPendingProductsGlobal, getAllShopsForAdmin } from "../../firebase/firestore";
import Breadcrumb from "../../components/ui/Breadcrumb";
import AdminNav from "../../components/layout/AdminNav";
import { formatCurrency } from "../../utils/formatCurrency";

export default function AdminProductsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [shopNameById, setShopNameById] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        const [productsData, shopsData] = await Promise.all([
            getAllPendingProductsGlobal(),
            getAllShopsForAdmin(),
        ]);
        const map = {};
        shopsData.forEach((s) => (map[s.id] = s.name));
        setShopNameById(map);
        setProducts(productsData);
        setLoading(false);
    }

    async function handleAction(product, action) {
        let reason = "";
        if (action === "reject") reason = prompt("เหตุผลที่ไม่อนุมัติสินค้านี้:") || "";

        setBusyId(product.id);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/approveProduct", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ shopId: product.shopId, productId: product.id, action, reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

            showToast(action === "approve" ? "อนุมัติสินค้าสำเร็จ" : "ปฏิเสธสินค้าแล้ว", "success");
            await load();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div>
            <AdminNav />
            <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
                <Breadcrumb items={[{ label: "รายชื่อร้าน", to: "/admin/shops" }, { label: "สินค้ารอตรวจสอบ" }]} />

                <h2>สินค้ารอตรวจสอบทั้งหมด ({products.length})</h2>

                {loading ? (
                    <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>
                ) : products.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)" }}>ไม่มีสินค้ารอตรวจสอบ</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {products.map((product) => (
                            <div
                                key={`${product.shopId}-${product.id}`}
                                className="card"
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12 }}
                            >
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    {product.imageUrl && (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }}
                                        />
                                    )}
                                    <div>
                                        <p style={{ margin: 0 }}>{product.name}</p>
                                        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                                            {formatCurrency(product.price)} ·{" "}
                                            <Link to={`/admin/shops/${product.shopId}`}>
                                                {shopNameById[product.shopId] || "ร้านที่ถูกลบไปแล้ว"}
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button disabled={busyId === product.id} onClick={() => handleAction(product, "approve")}>
                                        อนุมัติ
                                    </button>
                                    <button disabled={busyId === product.id} onClick={() => handleAction(product, "reject")}>
                                        ไม่อนุมัติ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}