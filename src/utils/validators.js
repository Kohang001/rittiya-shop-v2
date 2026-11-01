// src/utils/validators.js

/**
 * เช็คว่าเป็นเบอร์โทรไทยรูปแบบถูกต้อง (ต้องมีตัวเลข 10 หลักพอดี เช่น 0812345678)
 */
export function isValidPhone(value) {
    if (!value) return false;
    const digitsOnly = String(value).replace(/[-\s]/g, "");
    return /^[0-9]{10}$/.test(digitsOnly);
}

export function validatePhone(value) {
    if (!value) return { valid: false, error: "กรุณากรอกเบอร์โทรศัพท์" };
    if (!isValidPhone(value)) {
        return { valid: false, error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักพอดี" };
    }
    return { valid: true, error: null };
}

/**
 * เช็คว่าเป็นเลขพร้อมเพย์ถูกต้องไหม (10 หลักสำหรับเบอร์โทร หรือ 13 หลักสำหรับเลขบัตรประชาชน)
 */
export function isValidPromptPay(value) {
    if (!value) return true; // ไม่บังคับถ้าไม่ได้กรอก
    const digitsOnly = String(value).replace(/[-\s]/g, "");
    return /^[0-9]{10}$/.test(digitsOnly) || /^[0-9]{13}$/.test(digitsOnly);
}

/**
 * เช็คว่าเป็นเลขบัญชีธนาคารถูกต้องไหม (ตัวเลขล้วน 10 ถึง 12 หลัก)
 */
export function isValidBankAccountNumber(value) {
    if (!value) return true; // ไม่บังคับถ้าไม่ได้กรอก
    const digitsOnly = String(value).replace(/[-\s]/g, "");
    return /^[0-9]{10,12}$/.test(digitsOnly);
}

/**
 * เช็คว่าเป็นไอจีรูปแบบพอไหว (ตัวอักษร/ตัวเลข/จุด/underscore อย่างน้อย 1 ตัว)
 */
export function isValidInstagramHandle(value) {
    if (!value) return true; // ไม่บังคับกรอก
    return /^[a-zA-Z0-9._]{1,30}$/.test(String(value).replace("@", ""));
}

/**
 * เช็คไฟล์รูปก่อนอัปโหลด — ชนิดไฟล์และขนาด
 */
export function validateImageFile(file, maxSizeMB = 2) {
    if (!file || !file.type.startsWith("image/")) {
        return { valid: false, error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" };
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `ไฟล์ต้องมีขนาดไม่เกิน ${maxSizeMB}MB` };
    }
    return { valid: true, error: null };
}

/**
 * เช็คว่าราคาเป็นตัวเลขที่ใช้ได้จริง (ต้องมากกว่าหรือเท่ากับ 1 บาทขึ้นไป ไม่เกิน 1,000,000 บาท)
 */
export function isValidPrice(value) {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 1 && num <= 1000000;
}
