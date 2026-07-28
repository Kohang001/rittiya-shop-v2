// api/createOrder.js — เวอร์ชันล่าสุด: รวม status ออเดอร์ + เช็คร้านปิดชั่วคราว + push LINE
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
        return res.status(429).json({ error: "สั่งซื้อถี่เกินไป กรุณารอสักครู่" });
    }

    try {
        const { shopId, items, customerName, customerContact } = req.body;

        if (!shopId || typeof shopId !== "string") {
            return res.status(400).json({ error: "ไม่พบร้านค้า" });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "ไม่มีสินค้าในคำสั่งซื้อ" });
        }
        if (!customerName || !customerContact) {
            return res.status(400).json({ error: "กรุณากรอกชื่อและช่องทางติดต่อ" });
        }

        const shopRef = adminDb.collection("shops").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            return res.status(404).json({ error: "ไม่พบร้านค้านี้" });
        }
        const shop = shopSnap.data();
        if (shop.status !== "approved") {
            return res.status(403).json({ error: "ร้านนี้ยังไม่เปิดให้สั่งซื้อ" });
        }
        // เช็คร้านปิดชั่วคราว — ป้องกันแม้มีคนเรียก API ตรงๆ ข้ามหน้าเว็บ (undefined ถือว่าเปิด เพื่อรองรับร้านเก่าก่อนมีฟีเจอร์นี้)
        if (shop.isOpen === false) {
            return res.status(403).json({ error: "ร้านนี้ปิดรับออเดอร์ชั่วคราว" });
        }

        let total = 0;
        const validatedItems = [];

        for (const item of items) {
            if (!item.productId || !item.qty || item.qty <= 0) {
                return res.status(400).json({ error: "ข้อมูลสินค้าไม่ถูกต้อง" });
            }

            const productRef = shopRef.collection("products").doc(item.productId);
            const productSnap = await productRef.get();
            if (!productSnap.exists) {
                return res.status(400).json({ error: `ไม่พบสินค้า (${item.productId})` });
            }
            const product = productSnap.data();
            if (product.status !== "approved") {
                return res.status(400).json({ error: `สินค้า "${product.name}" ไม่พร้อมขาย` });
            }

            const qty = Number(item.qty);
            total += product.price * qty;
            validatedItems.push({
                productId: item.productId,
                name: product.name,
                price: product.price,
                qty,
            });
        }

        const orderRef = await shopRef.collection("orders").add({
            customerName: String(customerName).slice(0, 100),
            customerContact: String(customerContact).slice(0, 100),
            items: validatedItems,
            total,
            status: "pending", // pending -> preparing -> completed (หรือ cancelled)
            createdAt: new Date(),
        });

        if (shop.lineUserId) {
            const itemsText = validatedItems.map((item) => `- ${item.name} x${item.qty}`).join("\n");
            await pushMessage(shop.lineUserId, [
                {
                    type: "text",
                    text:
                        `📦 มีออเดอร์ใหม่!\n` +
                        `ผู้สั่ง: ${customerName}\n` +
                        `ติดต่อ: ${customerContact}\n\n` +
                        `รายการ:\n${itemsText}\n\n` +
                        `ยอดรวม: ${total.toLocaleString()} บาท`,
                },
            ]);
        }

        return res.status(200).json({
            orderId: orderRef.id,
            total,
            promptpayTarget: shop.promptpayId || shop.phone, // ใช้สร้าง QR ฝั่ง client
        });
    } catch (err) {
        console.error("createOrder error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    }
}