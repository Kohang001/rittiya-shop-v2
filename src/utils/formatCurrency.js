// src/utils/formatCurrency.js

/** แปลงตัวเลขเป็นข้อความราคาแบบไทย เช่น 1250 -> "1,250 บาท" */
export function formatCurrency(amount) {
    const value = Number(amount) || 0;
    return `${value.toLocaleString("th-TH")} บาท`;
}

/** แปลงตัวเลขล้วนๆ แบบมี comma โดยไม่ต่อ "บาท" เช่นใช้โชว์คู่กับ label เอง */
export function formatNumber(amount) {
    const value = Number(amount) || 0;
    return value.toLocaleString("th-TH");
}