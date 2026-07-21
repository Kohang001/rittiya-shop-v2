// src/cloudinary/upload.js
// ใช้แทน Firebase Storage เพราะ Firebase Storage บังคับ Blaze plan แล้ว (ตั้งแต่ 3 ก.พ. 2026)
// Cloudinary free plan ไม่ต้องผูกบัตร และอัปโหลดตรงจาก client ได้เลย

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * อัปโหลดไฟล์รูปไป Cloudinary แล้วคืนค่า URL ที่ใช้แสดงผลได้เลย
 * @param {File} file - ไฟล์รูปจาก <input type="file">
 * @returns {Promise<string>} secure_url ของรูปที่อัปโหลดสำเร็จ
 */
export async function uploadImage(file) {
    // ตรวจสอบเบื้องต้นฝั่ง client ก่อนอัปโหลด (ลดโอกาสเปลืองโควต้าฟรีโดยไม่จำเป็น)
    const MAX_SIZE_MB = 2;
    if (!file.type.startsWith("image/")) {
        throw new Error("ไฟล์ต้องเป็นรูปภาพเท่านั้น");
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`ไฟล์ต้องมีขนาดไม่เกิน ${MAX_SIZE_MB}MB`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
    );

    if (!response.ok) {
        throw new Error("อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
    }

    const data = await response.json();
    return data.secure_url; // เอา URL นี้ไปเก็บใน field imageUrl/logoUrl ของ Firestore
}