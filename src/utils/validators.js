// src/utils/validators.js

/** เช็คว่าเป็นเบอร์โทรไทยรูปแบบถูกต้องไหม (9-10 หลัก ไม่รวมขีด/วรรค) */
export function isValidPhone(value) {
    if (!value) return false;
    const digitsOnly = value.replace(/[-\s]/g, "");
    return /^[0-9]{9,10}$/.test(digitsOnly);
}

/** เช็คว่าเป็นไอจีรูปแบบพอไหว (ตัวอักษร/ตัวเลข/จุด/underscore อย่างน้อย 1 ตัว) */
export function isValidInstagramHandle(value) {
    if (!value) return true; // ไม่บังคับกรอก
    return /^[a-zA-Z0-9._]{1,30}$/.test(value.replace("@", ""));
}

/** เช็คไฟล์รูปก่อนอัปโหลด — ชนิดไฟล์และขนาด */
export function validateImageFile(file, maxSizeMB = 2) {
    if (!file.type.startsWith("image/")) {
        return { valid: false, error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" };
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `ไฟล์ต้องมีขนาดไม่เกิน ${maxSizeMB}MB` };
    }
    return { valid: true, error: null };
}

/** เช็คว่าราคาเป็นตัวเลขที่ใช้ได้จริง (ไม่ติดลบ ไม่เกินเพดานสมเหตุสมผล) */
export function isValidPrice(value) {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 0 && num <= 1000000;
}