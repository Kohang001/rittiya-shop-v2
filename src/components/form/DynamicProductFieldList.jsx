// src/components/form/DynamicProductFieldList.jsx
import { useFieldArray } from "react-hook-form";
import ImageUploadField from "./ImageUploadField";

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
            <h3>รายการสินค้า</h3>

            {fields.length === 0 && (
                <p style={{ color: "#888" }}>ยังไม่มีสินค้า กดปุ่มด้านล่างเพื่อเพิ่ม</p>
            )}

            {fields.map((field, index) => (
                <div
                    key={field.id}
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12,
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>สินค้าชิ้นที่ {index + 1}</strong>
                        <button type="button" onClick={() => remove(index)}>
                            ลบ
                        </button>
                    </div>

                    <label>ชื่อสินค้า</label>
                    <input
                        {...register(`products.${index}.name`, { required: true })}
                        style={{ display: "block", width: "100%", marginBottom: 8 }}
                    />

                    <label>รายละเอียด</label>
                    <textarea
                        {...register(`products.${index}.desc`)}
                        style={{ display: "block", width: "100%", marginBottom: 8 }}
                    />

                    <label>ราคา (บาท)</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register(`products.${index}.price`, { required: true, min: 0 })}
                        style={{ display: "block", width: "100%", marginBottom: 8 }}
                    />

                    <ImageUploadField
                        label="รูปสินค้า"
                        value={watch(`products.${index}.imageUrl`)}
                        onChange={(url) => setValue(`products.${index}.imageUrl`, url)}
                    />
                </div>
            ))}

            <button type="button" onClick={handleAddProduct}>
                + เพิ่มสินค้า
            </button>
        </div>
    );
}