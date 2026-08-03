// src/pages/seller/SellerProductsPage.jsx — อัปเดต Phase 9: แก้สินค้าที่อนุมัติแล้วต้องรออนุมัติใหม่
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    getShopsByOwner,
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct,
} from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";

const STATUS_LABEL = {
    pending: { text: "รอตรวจสอบ", color: "var(--color-status-pending)" },
    approved: { text: "อนุมัติแล้ว", color: "var(--color-status-approved)" },
    rejected: { text: "ไม่อนุมัติ", color: "var(--color-status-rejected)" },
};

const EMPTY_FORM = { name: "", desc: "", price: "", imageUrl: "" };

export default function SellerProductsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        load();
    }, [user]);

    async function load() {
        setLoading(true);
        const shops = await getShopsByOwner(user.uid);
        const myShop = shops[0] || null;
        setShop(myShop);
        if (myShop) {
            const productsData = await getAllProducts(myShop.id);
            setProducts(productsData);
        }
        setLoading(false);
    }

    function startEdit(product) {
        setEditingId(product.id);
        setForm({
            name: product.name,
            desc: product.desc || "",
            price: product.price,
            imageUrl: product.imageUrl || "",
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    function notifyAdminNewProduct(productName) {
        fetch("/api/notifyNewProduct", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId: shop.id, productName }),
        }).catch((err) => console.error("แจ้งเตือน Admin ไม่สำเร็จ (ไม่กระทบการบันทึก):", err));
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name || !form.price) return;

        setSaving(true);
        try {
            if (editingId) {
                const currentProduct = products.find((p) => p.id === editingId);
                const updates = {
                    name: form.name,
                    desc: form.desc,
                    price: parseFloat(form.price) || 0,
                    imageUrl: form.imageUrl,
                };
                // เช็คว่าแก้แค่ราคา (เนื้อหาไม่เปลี่ยน) หรือแก้เนื้อหาด้วย — ราคาอย่างเดียวไม่ต้องรออนุมัติใหม่
                const contentChanged =
                    currentProduct?.name !== updates.name ||
                    (currentProduct?.desc || "") !== updates.desc ||
                    (currentProduct?.imageUrl || "") !== updates.imageUrl;

                if (currentProduct?.status === "approved" && contentChanged) {
                    updates.status = "pending";
                }
                await updateProduct(shop.id, editingId, updates);
                if (currentProduct?.status === "approved" && contentChanged) {
                    notifyAdminNewProduct(form.name);
                }
            } else {
                const newProductId = await addProduct(shop.id, {
                    name: form.name,
                    desc: form.desc,
                    price: parseFloat(form.price) || 0,
                    imageUrl: form.imageUrl,
                });
                notifyAdminNewProduct(form.name);
            }
            cancelEdit();
            await load();
            showToast(editingId ? "บันทึกการแก้ไขสำเร็จ" : "เพิ่มสินค้าสำเร็จ", "success");
        } catch (err) {
            console.error(err);
            showToast("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(productId) {
        if (!confirm("ลบสินค้านี้แน่ใจไหม?")) return;
        await deleteProduct(shop.id, productId);
        await load();
    }

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    const editingProduct = editingId ? products.find((p) => p.id === editingId) : null;

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
            <h2>จัดการสินค้า — {shop.name}</h2>

            <form
                onSubmit={handleSave}
                style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 24 }}
            >
                <h4>{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h4>

                {editingProduct?.status === "approved" && (
                    <p style={{ fontSize: 12, color: "var(--color-status-pending)", background: "var(--color-status-pending-bg)", padding: 8, borderRadius: 6 }}>
                        ⚠️ สินค้านี้อนุมัติแล้ว — แก้แค่ราคาไม่ต้องรออนุมัติใหม่ แต่ถ้าแก้ชื่อ/รายละเอียด/รูป จะต้องรอ Admin ตรวจสอบใหม่อีกครั้ง
                    </p>
                )}

                <label>ชื่อสินค้า</label>
                <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <label>รายละเอียด</label>
                <textarea
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value })}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                />

                <label>ราคา (บาท)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <ImageUploadField
                    label="รูปสินค้า"
                    value={form.imageUrl}
                    onChange={(url) => setForm({ ...form, imageUrl: url })}
                />

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="submit" disabled={saving}>
                        {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "+ เพิ่มสินค้า"}
                    </button>
                    {editingId && (
                        <button type="button" onClick={cancelEdit}>
                            ยกเลิก
                        </button>
                    )}
                </div>

                {!editingId && (
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
                        สินค้าที่เพิ่มใหม่จะมีสถานะ "รอตรวจสอบ" จนกว่า Admin จะอนุมัติ
                    </p>
                )}
            </form>

            <h4>สินค้าทั้งหมด ({products.length})</h4>
            {products.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>ยังไม่มีสินค้า</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {products.map((product) => {
                        const statusInfo = STATUS_LABEL[product.status] || { text: product.status, color: "var(--color-text-muted)" };
                        return (
                            <div
                                key={product.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    border: "1px solid #eee",
                                    borderRadius: 8,
                                    padding: 10,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                                            {product.price?.toLocaleString()} บาท ·{" "}
                                            <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => startEdit(product)}>แก้ไข</button>
                                    <button onClick={() => handleDelete(product.id)}>ลบ</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}