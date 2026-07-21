// src/components/form/ImageUploadField.jsx
import { useState } from "react";
import { uploadImage } from "../../cloudinary/upload";

/**
 * ใช้ซ้ำได้ทั้งอัปโหลดโลโก้ร้านและรูปสินค้า
 * @param {string} value - URL รูปปัจจุบัน (ถ้ามี)
 * @param {(url: string) => void} onChange - เรียกตอนอัปโหลดสำเร็จ ได้ URL กลับมา
 * @param {string} label
 */
export default function ImageUploadField({ value, onChange, label = "รูปภาพ" }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState(value || "");

    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");

        // แสดง preview ทันทีจากไฟล์ในเครื่องก่อน ระหว่างรออัปโหลดจริง
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        setUploading(true);
        try {
            const url = await uploadImage(file);
            setPreviewUrl(url);
            onChange(url);
        } catch (err) {
            setError(err.message || "อัปโหลดไม่สำเร็จ");
            setPreviewUrl(value || "");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>{label}</label>

            {previewUrl && (
                <img
                    src={previewUrl}
                    alt="preview"
                    style={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginBottom: 8,
                        display: "block",
                    }}
                />
            )}

            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />

            {uploading && <p style={{ fontSize: 12, color: "#888" }}>กำลังอัปโหลด...</p>}
            {error && <p style={{ fontSize: 12, color: "red" }}>{error}</p>}
        </div>
    );
}