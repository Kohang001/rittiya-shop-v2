// src/components/form/ImageUploadField.jsx — อัปเดต: ใช้ validators.js ร่วมกับที่อื่น
import { useState } from "react";
import { uploadImage } from "../../cloudinary/upload";
import { validateImageFile } from "../../utils/validators";

export default function ImageUploadField({ value, onChange, label = "รูปภาพ" }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState(value || "");

    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");

        const check = validateImageFile(file);
        if (!check.valid) {
            setError(check.error);
            return;
        }

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
            <label>{label}</label>

            {previewUrl && (
                <img
                    src={previewUrl}
                    alt="preview"
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 8, display: "block" }}
                />
            )}

            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />

            {uploading && <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>กำลังอัปโหลด...</p>}
            {error && <p style={{ fontSize: 12, color: "var(--color-danger)" }}>{error}</p>}
        </div>
    );
}