// src/pages/seller/SellerProductsPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    getShopsByOwner,
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct,
} from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";

const STATUS_LABEL = {
    pending: { text: "รอตรวจสอบ", color: "#a60" },
    approved: { text: "อนุมัติแล้ว", color: "#080" },
    rejected: { text: "ไม่อนุมัติ", color: "#c00" },
};

const EMPTY_FORM = { name: "", desc: "", price: "", imageUrl: "" };

export default function SellerProductsPage() {
    const { user } = useAuth();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null); // productId ที่กำลังแก้ (null = กำลังเพิ่มใหม่)
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

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name || !form.price) return;

        setSaving(true);
        try {
            if (editingId) {
                // แก้ไขสินค้าเดิม — ไม่รีเซ็ตสถานะเป็น pending เพราะเป็นแค่การแก้รายละเอียด/ราคา
                await updateProduct(shop.id, editingId, {
                    name: form.name,
                    desc: form.desc,
                    price: parseFloat(form.price) || 0,
                    imageUrl: form.imageUrl,
                });
            } else {
                // เพิ่มสินค้าใหม่ — สถานะ pending เสมอ (บังคับโดย Security Rules อยู่แล้ว)
                await addProduct(shop.id, {
                    name: form.name,
                    desc: form.desc,
                    price: parseFloat(form.price) || 0,
                    imageUrl: form.imageUrl,
                });
            }
            cancelEdit();
            await load();
        } catch (err) {
            console.error(err);
            alert("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
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

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
            <h2>จัดการสินค้า — {shop.name}</h2>

            <form
                onSubmit={handleSave}
                style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 24 }}
            >
                <h4>{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h4>

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
                    <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                        สินค้าที่เพิ่มใหม่จะมีสถานะ "รอตรวจสอบ" จนกว่า Admin จะอนุมัติ
                    </p>
                )}
            </form>

            <h4>สินค้าทั้งหมด ({products.length})</h4>
            {products.length === 0 ? (
                <p style={{ color: "#888" }}>ยังไม่มีสินค้า</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {products.map((product) => {
                        const statusInfo = STATUS_LABEL[product.status] || { text: product.status, color: "#666" };
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
                                        <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
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