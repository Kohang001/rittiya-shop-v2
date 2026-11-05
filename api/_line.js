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
    const res = await fetch(`${LINE_API_BASE}/message/reply`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ replyToken, messages }),
    });
    if (!res.ok) {
        console.error("LINE replyMessage failed:", res.status, await res.text());
    }
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

/** ดึง lineUserId ของ Admin ทุกคนที่เชื่อมต่อไว้ในระบบ (ทั้ง admins/{uid} และ config/admin) */
export async function getAdminLineUserIds(adminDb) {
    const ids = new Set();
    try {
        // 1. ดึงจากคอลเลกชัน admins ที่ผูก lineUserId ไว้
        const adminsSnap = await adminDb.collection("admins").where("lineUserId", "!=", null).get();
        adminsSnap.forEach((doc) => {
            const data = doc.data();
            if (data.lineUserId && typeof data.lineUserId === "string" && data.lineUserId.trim()) {
                ids.add(data.lineUserId.trim());
            }
        });

        // 2. ดึงจาก config/admin (กรณี Master Admin เดิม)
        const configSnap = await adminDb.collection("config").doc("admin").get();
        if (configSnap.exists) {
            const configData = configSnap.data();
            if (configData.lineUserId && typeof configData.lineUserId === "string" && configData.lineUserId.trim()) {
                ids.add(configData.lineUserId.trim());
            }
        }
    } catch (err) {
        console.warn("getAdminLineUserIds error:", err);
    }
    return Array.from(ids);
}

/** ส่งข้อความแจ้งเตือนหา Admin ทุกคนที่เชื่อมต่อไว้ในระบบแบบ Real-time */
export async function notifyAllAdmins(adminDb, messages) {
    const adminIds = await getAdminLineUserIds(adminDb);
    if (!adminIds.length) {
        console.warn("No admin LINE accounts linked yet to receive notification.");
        return;
    }

    await Promise.allSettled(
        adminIds.map((userId) => pushMessage(userId, messages))
    );
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