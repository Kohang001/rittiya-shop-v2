// api/uploadSlip.js
import { adminDb } from "./_firebaseAdmin.js";
import { pushMessage } from "./_line.js";

const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function isRateLimited(ip) {
    const now = Date.now();
    const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    timestamps.push(now);
    requestLog.set(ip, timestamps);
    return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: "ลองถี่เกินไป กรุณารอสักครู่" });
    }

    const { shopId, orderId, slipUrl } = req.body;
    if (!shopId || !orderId || !slipUrl) {
        return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
    }
    // เช็คคร่าวๆ ว่าเป็น URL รูปจาก Cloudinary จริง กัน URL แปลกปลอมถูกส่งต่อไปที่ LINE
    if (!slipUrl.startsWith("https://res.cloudinary.com/")) {
        return res.status(400).json({ error: "รูปสลิปไม่ถูกต้อง" });
    }

    try {
        const shopRef = adminDb.collection("shops").doc(shopId);
        const orderRef = shopRef.collection("orders").doc(orderId);

        const [shopSnap, orderSnap] = await Promise.all([shopRef.get(), orderRef.get()]);
        if (!shopSnap.exists) return res.status(404).json({ error: "ไม่พบร้านค้า" });
        if (!orderSnap.exists) return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });

        const shop = shopSnap.data();
        const order = orderSnap.data();

        // ป้องกันการอัปสลิปซ้ำหรือแก้ไขออเดอร์ที่ผ่านการดำเนินการไปแล้ว
        if (order.status !== "pending") {
            return res.status(409).json({ error: "ออเดอร์นี้ไม่สามารถอัปโหลดสลิปได้แล้ว (มีการดำเนินการไปแล้ว)" });
        }

        await orderRef.update({
            slipUrl,
            status: "slip_uploaded",
            slipUploadedAt: new Date(),
        });

        if (shop.lineUserId) {
            await pushMessage(shop.lineUserId, [
                {
                    type: "text",
                    text:
                        `💳 ลูกค้าส่งสลิปการโอนเงินแล้ว\n` +
                        `ผู้สั่ง: ${order.customerName}\n` +
                        `ยอด: ${order.total.toLocaleString()} บาท\n\n` +
                        `กรุณาตรวจสอบสลิปด้านล่าง แล้วกดยืนยันในหน้า Dashboard ร้านค้า\n` +
                        `https://rittiya-shop-v2.vercel.app/seller/dashboard`,
                },
                {
                    type: "image",
                    originalContentUrl: slipUrl,
                    previewImageUrl: slipUrl,
                },
            ]);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("uploadSlip error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
}