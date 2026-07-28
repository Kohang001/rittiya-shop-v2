// src/utils/promptpay.js
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

/**
 * สร้างรูป QR PromptPay แบบใส่ยอดเงินอัตโนมัติ (ฟรี ไม่ต้องขอ API key จากใคร)
 * @param {string} target - เบอร์โทรหรือเลขพร้อมเพย์ของร้าน
 * @param {number} amount - ยอดเงินที่ต้องจ่าย
 * @returns {Promise<string>} data URL ของรูป QR ใช้ใส่ <img src={...} /> ได้ตรงๆ
 */
export async function generatePromptPayQR(target, amount) {
    const payload = generatePayload(target, { amount });
    return QRCode.toDataURL(payload, { width: 260, margin: 1 });
}