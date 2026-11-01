// src/pages/seller/SellerProductsPage.jsx — With In-Stock / Out-of-Stock Management
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    getShopsByOwner,
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    setProductAvailability,
} from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";
import ConfirmModal from "../../components/ui/ConfirmModal";
import PageSkeleton from "../../components/ui/PageSkeleton";
import { validateFields } from "../../utils/contentFilter";
import { isValidPrice } from "../../utils/validators";
import Icon from "../../components/ui/Icon";
import StatusBadge from "../../components/ui/StatusBadge";

const EMPTY_FORM = { name: "", desc: "", price: "", imageUrl: "", isAvailable: true };

export default function SellerProductsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

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
            isAvailable: product.isAvailable !== false,
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    async function handleToggleStock(product) {
        if (!shop) return;
        const newAvailable = product.isAvailable === false;
        setTogglingId(product.id);
        try {
            await setProductAvailability(shop.id, product.id, newAvailable);
            showToast(newAvailable ? `เปลี่ยนเป็น "พร้อมขาย" แล้ว` : `เปลี่ยนเป็น "สินค้าหมด" แล้ว`, "success");
            await load();
        } catch (err) {
            console.error(err);
            showToast("เปลี่ยนสถานะสต็อกไม่สำเร็จ", "error");
        } finally {
            setTogglingId(null);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        const trimmedName = form.name?.trim();
        if (!trimmedName) {
            showToast("กรุณาระบุชื่อสินค้า", "error");
            return;
        }

        if (!isValidPrice(form.price)) {
            showToast("ราคาสินค้าต้องตั้งแต่ 1 บาทขึ้นไป (ไม่อนุญาตให้ใส่ราคา 0 บาทหรือติดลบ)", "error");
            return;
        }

        const contentCheck = validateFields([
            { label: "ชื่อสินค้า", value: trimmedName },
            { label: "คำอธิบายสินค้า", value: form.desc?.trim() || "" },
        ]);
        if (!contentCheck.isValid) {
            showToast(contentCheck.error, "error");
            return;
        }

        setSaving(true);
        try {
            const parsedPrice = parseFloat(form.price) || 1;
            if (editingId) {
                const updates = {
                    name: trimmedName,
                    desc: form.desc?.trim() || "",
                    price: parsedPrice,
                    imageUrl: form.imageUrl || "",
                    isAvailable: form.isAvailable !== false,
                };
                await updateProduct(shop.id, editingId, updates);
            } else {
                const newProductId = await addProduct(shop.id, {
                    name: trimmedName,
                    desc: form.desc?.trim() || "",
                    price: parsedPrice,
                    imageUrl: form.imageUrl || "",
                    isAvailable: form.isAvailable !== false,
                });

                // แจ้งเตือนสินค้าใหม่ไปยัง LINE ของ Admin
                fetch("/api/notifyNewProduct", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        shopId: shop.id,
                        productId: newProductId,
                        productName: trimmedName,
                        productDesc: form.desc?.trim() || "",
                        price: parsedPrice,
                    }),
                }).catch(() => {});
            }
            cancelEdit();
            await load();
            showToast(editingId ? "บันทึกการแก้ไขสินค้าสำเร็จ" : "เพิ่มสินค้าใหม่สำเร็จ", "success");
        } catch (err) {
            console.error(err);
            showToast("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(productId) {
        setConfirmDeleteId(null);
        await deleteProduct(shop.id, productId);
        showToast("ลบสินค้าแล้ว", "success");
        await load();
    }

    if (loading) return <PageSkeleton lines={6} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 740, margin: "40px auto", padding: "0 16px" }}>
            <h2 style={{ marginBottom: 4 }}>จัดการสินค้า — {shop.name}</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 24 }}>
                เพิ่ม แก้ไข หรือเปิด/ปิดสถานะสินค้าหมดได้ทันทีแบบเรียลไทม์
            </p>

            {/* Form เพิ่ม / แก้ไขสินค้า */}
            <form
                onSubmit={handleSave}
                className="card"
                style={{
                    padding: 20,
                    marginBottom: 32,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-surface)",
                }}
            >
                <h4 style={{ margin: "0 0 16px 0", fontSize: 16 }}>
                    {editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
                </h4>

                <label htmlFor="prod-name">ชื่อสินค้า</label>
                <input
                    id="prod-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="เช่น ข้าวเหนียวหมูปิ้ง, ชานมไข่มุก"
                    style={{ display: "block", width: "100%", marginBottom: 12 }}
                    required
                />

                <label htmlFor="prod-desc">รายละเอียดสินค้า (ถ้ามี)</label>
                <textarea
                    id="prod-desc"
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value })}
                    placeholder="เช่น หมูนุ่ม หอมกรุ่น เสิร์ฟพร้อมข้าวเหนียวร้อนๆ"
                    rows={2}
                    style={{ display: "block", width: "100%", marginBottom: 12 }}
                />

                <label htmlFor="prod-price">ราคา (บาท) — ต้องตั้งแต่ 1 บาทขึ้นไป</label>
                <input
                    id="prod-price"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="เช่น 35"
                    style={{ display: "block", width: "100%", marginBottom: 14 }}
                    required
                />

                <ImageUploadField
                    label="รูปสินค้า"
                    value={form.imageUrl}
                    onChange={(url) => setForm({ ...form, imageUrl: url })}
                />

                {/* ตัวเลือกเปิด/ปิดสถานะสินค้าพร้อมขาย */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <input
                        type="checkbox"
                        id="prod-available"
                        checked={form.isAvailable}
                        onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <label htmlFor="prod-available" style={{ margin: 0, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        สินค้าพร้อมขายในหน้าร้าน (เปิดเป็น "สินค้าหมด" หากของหมดสต็อกชั่วคราว)
                    </label>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 18px",
                            background: "var(--color-primary)",
                            color: "#fff",
                            fontWeight: 600,
                            borderRadius: "var(--radius-sm)",
                            border: "none",
                        }}
                    >
                        {saving ? (
                            <>
                                <Icon name="sparkle" size={15} color="#fff" />
                                กำลังบันทึก...
                            </>
                        ) : editingId ? (
                            <>
                                <Icon name="check" size={15} color="#fff" />
                                บันทึกการแก้ไข
                            </>
                        ) : (
                            <>
                                <Icon name="plus" size={15} color="#fff" />
                                เพิ่มสินค้า
                            </>
                        )}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            style={{
                                padding: "8px 16px",
                                background: "var(--color-bg-subtle)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                            }}
                        >
                            ยกเลิก
                        </button>
                    )}
                </div>

                {!editingId && (
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10, marginBottom: 0 }}>
                        สินค้าที่ไม่มีคำต้องห้ามจะได้รับการอนุมัติและแสดงบนหน้าร้านอัตโนมัติทันที
                    </p>
                )}
            </form>

            <h4 style={{ margin: "0 0 12px 0", fontSize: 16 }}>สินค้าทั้งหมด ({products.length})</h4>
            {products.length === 0 ? (
                <div
                    style={{
                        padding: "32px 16px",
                        textAlign: "center",
                        border: "1px dashed var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-text-muted)",
                        background: "var(--color-bg-subtle)",
                    }}
                >
                    <Icon name="box" size={32} color="var(--color-text-muted)" />
                    <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>ยังไม่มีสินค้าในร้าน</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {products.map((product) => {
                        const isOutOfStock = product.isAvailable === false;
                        const isBusy = togglingId === product.id;

                        return (
                            <div
                                key={product.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: 12,
                                    background: isOutOfStock ? "var(--color-bg-subtle)" : "var(--color-bg-surface)",
                                    opacity: isOutOfStock ? 0.8 : 1,
                                    flexWrap: "wrap",
                                    gap: 12,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 220 }}>
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            style={{
                                                width: 48,
                                                height: 48,
                                                objectFit: "cover",
                                                borderRadius: "var(--radius-sm)",
                                                filter: isOutOfStock ? "grayscale(80%)" : "none",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 48,
                                                height: 48,
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
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{product.name}</p>
                                            {isOutOfStock ? (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: "2px 6px",
                                                        borderRadius: 4,
                                                        background: "rgba(245, 158, 11, 0.15)",
                                                        color: "#b45309",
                                                    }}
                                                >
                                                    สินค้าหมด
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: "2px 6px",
                                                        borderRadius: 4,
                                                        background: "rgba(34, 197, 94, 0.15)",
                                                        color: "var(--color-success)",
                                                    }}
                                                >
                                                    พร้อมขาย
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                            <span style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>
                                                {product.price?.toLocaleString()} บาท
                                            </span>
                                            <StatusBadge status={product.status === "rejected" ? "rejected" : "approved"} size="sm" />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                                    {/* Toggle สต็อกสินค้า */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStock(product)}
                                        disabled={isBusy}
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: 12,
                                            fontWeight: 500,
                                            borderRadius: "var(--radius-sm)",
                                            background: isOutOfStock ? "var(--color-bg-surface)" : "var(--color-bg-subtle)",
                                            border: "1px solid var(--color-border)",
                                            color: isOutOfStock ? "var(--color-success)" : "var(--color-text-muted)",
                                            cursor: isBusy ? "not-allowed" : "pointer",
                                        }}
                                        title={isOutOfStock ? "คลิกเพื่อเปลี่ยนเป็นพร้อมขาย" : "คลิกเพื่อทำเป็นสินค้าหมด"}
                                    >
                                        {isBusy ? "กำลังอัปเดต..." : isOutOfStock ? "เปิดขายต่อ" : "ของหมด"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => startEdit(product)}
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: 13,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4,
                                            background: "var(--color-bg-subtle)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-sm)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Icon name="edit" size={13} /> แก้ไข
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(product.id)}
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: 13,
                                            color: "var(--color-danger)",
                                            background: "var(--color-status-rejected-bg)",
                                            border: "1px solid rgba(239, 68, 68, 0.2)",
                                            borderRadius: "var(--radius-sm)",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Icon name="trash" size={13} color="var(--color-danger)" /> ลบ
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {confirmDeleteId && (
                <ConfirmModal
                    message="ต้องการลบสินค้านี้ใช่หรือไม่?"
                    onConfirm={() => handleDelete(confirmDeleteId)}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}
