// src/components/form/DynamicProductFieldList.jsx
import { useFieldArray } from "react-hook-form";
import ImageUploadField from "./ImageUploadField";
import Icon from "../ui/Icon";

/**
 * ให้แม่ค้าเพิ่มสินค้าได้ไม่จำกัดจำนวนตอนสมัครร้าน
 * ใช้ useFieldArray ของ react-hook-form จัดการ list แบบ dynamic
 */
export default function DynamicProductFieldList({ control, register, watch, setValue }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "products",
    });

    function handleAddProduct() {
        append({ name: "", desc: "", price: "", imageUrl: "" });
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: "clamp(16px, 3.5vw, 18px)" }}>รายการสินค้าในร้าน</h3>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    อย่างน้อย 1 ชิ้น (ราคาเริ่มต้น 1 บาท)
                </span>
            </div>

            {fields.length === 0 && (
                <div
                    style={{
                        padding: "24px 16px",
                        textAlign: "center",
                        border: "1px dashed var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-text-muted)",
                        marginBottom: 16,
                        background: "var(--color-bg-subtle)",
                    }}
                >
                    <Icon name="box" size={32} color="var(--color-text-muted)" />
                    <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>ยังไม่มีสินค้าในร้าน กดปุ่มด้านล่างเพื่อเพิ่ม</p>
                </div>
            )}

            {fields.map((field, index) => (
                <div
                    key={field.id}
                    className="card"
                    style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: 16,
                        marginBottom: 16,
                        background: "var(--color-bg-surface)",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon name="box" size={16} color="var(--color-primary)" />
                            สินค้าชิ้นที่ {index + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => remove(index)}
                            style={{
                                background: "var(--color-status-rejected-bg)",
                                color: "var(--color-danger)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                borderRadius: "var(--radius-sm)",
                                padding: "4px 10px",
                                fontSize: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                cursor: "pointer",
                            }}
                        >
                            <Icon name="trash" size={12} color="var(--color-danger)" />
                            ลบ
                        </button>
                    </div>

                    <label htmlFor={`product-name-${index}`} style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                        ชื่อสินค้า *
                    </label>
                    <input
                        id={`product-name-${index}`}
                        placeholder="เช่น ข้าวเหนียวหมูปิ้ง, ชานมไข่มุก"
                        {...register(`products.${index}.name`, { required: true })}
                        style={{ display: "block", width: "100%", marginBottom: 10 }}
                    />

                    <label htmlFor={`product-desc-${index}`} style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                        รายละเอียดสินค้า
                    </label>
                    <textarea
                        id={`product-desc-${index}`}
                        placeholder="รายละเอียด เช่น ขนาด วัตถุดิบ รสชาติ"
                        rows={2}
                        {...register(`products.${index}.desc`)}
                        style={{ display: "block", width: "100%", marginBottom: 10 }}
                    />

                    <label htmlFor={`product-price-${index}`} style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                        ราคา (บาท) * <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(ขั้นต่ำ 1 บาท)</span>
                    </label>
                    <input
                        id={`product-price-${index}`}
                        type="number"
                        step="any"
                        min="1"
                        placeholder="ระบุราคา 1 บาทขึ้นไป"
                        {...register(`products.${index}.price`, { required: true, min: 1 })}
                        style={{ display: "block", width: "100%", marginBottom: 12 }}
                    />

                    <ImageUploadField
                        label="รูปสินค้า"
                        value={watch(`products.${index}.imageUrl`)}
                        onChange={(url) => setValue(`products.${index}.imageUrl`, url)}
                    />
                </div>
            ))}

            <button
                type="button"
                onClick={handleAddProduct}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    background: "var(--color-bg-subtle)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-primary)",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontSize: 14,
                }}
            >
                <Icon name="plus" size={16} color="var(--color-primary)" />
                เพิ่มสินค้า
            </button>
        </div>
    );
}
