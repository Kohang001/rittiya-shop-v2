// api/_line.js
// Helper รวมฟังก์ชันที่ใช้คุยกับ LINE Messaging API

import crypto from "crypto";

const LINE_API_BASE = "https://api.line.me/v2/bot";

/** ตรวจสอบว่า request มาจาก LINE จริง (กัน webhook ปลอม) */
export function verifyLineSignature(rawBody, signature) {
    const hash = crypto
        .createHmac("sha256", process.env.LINE_CHANNEL_SECRET)
        .update(rawBody)
        .digest("base64");
    return hash === signature;
}

/** ตอบกลับข้อความในแชทเดิม (ใช้ตอบตอนผูกบัญชีสำเร็จ/ไม่สำเร็จ) */
export async function replyMessage(replyToken, messages) {
    await fetch(`${LINE_API_BASE}/message/reply`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ replyToken, messages }),
    });
}

/** ส่งข้อความแจ้งเตือนไปหา user โดยตรง (ใช้ตอนมีออเดอร์ใหม่/ร้านใหม่) */
export async function pushMessage(userId, messages) {
    const res = await fetch(`${LINE_API_BASE}/message/push`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ to: userId, messages }),
    });
    if (!res.ok) {
        console.error("LINE push failed:", await res.text());
    }
}

/** อ่าน raw body ของ request (จำเป็นสำหรับตรวจ signature ให้ตรงเป๊ะ) */
export function readRawBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(data));
        req.on("error", reject);
    });
}