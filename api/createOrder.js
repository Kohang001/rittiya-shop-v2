// api/createOrder.js
import { adminDb } from "./_firebaseAdmin.js";

// ---------- Rate limiting แบบง่าย (in-memory) ----------
// หมายเหตุ: เก็บใน memory ของ serverless function เฉยๆ ไม่ persist ข้าม cold start
// เป็นชั้นป้องกันเบื้องต้นเท่านั้น ไม่ใช่ระบบ rate-limit ที่สมบูรณ์แบบ
const requestLog = new Map(); // key: ip, value: [timestamp, timestamp, ...]
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 นาที
const RATE_LIMIT_MAX_REQUESTS = 5; // สั่งซื้อได้ไม่เกิน 5 ครั้ง/นาที/IP

function isRateLimited(ip) {
    const now = Date.now();
    const timestamps = (requestLog.get(ip) || []).filter(
        (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
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

        // ---------- Validate input พื้นฐาน ----------
        if (!shopId || typeof shopId !== "string") {
            return res.status(400).json({ error: "ไม่พบร้านค้า" });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "ไม่มีสินค้าในคำสั่งซื้อ" });
        }
        if (!customerName || !customerContact) {
            return res.status(400).json({ error: "กรุณากรอกชื่อและช่องทางติดต่อ" });
        }
        const phonePattern = /^[0-9]{9,10}$/;
        const isPhoneValid = phonePattern.test(customerContact.replace(/[- ]/g, ""));
        // อนุญาตทั้งเบอร์โทรและ IG (ขึ้นต้นด้วย @ หรือเป็นข้อความทั่วไป) เลยเช็คแบบไม่เข้มงวดเกินไป
        if (!isPhoneValid && customerContact.length < 2) {
            return res.status(400).json({ error: "ช่องทางติดต่อไม่ถูกต้อง" });
        }

        // ---------- เช็คว่าร้านมีอยู่จริงและอนุมัติแล้ว ----------
        const shopRef = adminDb.collection("shops").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            return res.status(404).json({ error: "ไม่พบร้านค้านี้" });
        }
        const shop = shopSnap.data();
        if (shop.status !== "approved") {
            return res.status(403).json({ error: "ร้านนี้ยังไม่เปิดให้สั่งซื้อ" });
        }

        // ---------- คำนวณราคาจริงจาก Firestore เท่านั้น (ไม่เชื่อราคาที่ client ส่งมา) ----------
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

            // กันสินค้าจากร้านอื่นหลุดเข้ามา (เพราะ query อยู่ใต้ shopRef อยู่แล้วจริงๆ กันซ้ำอีกชั้น)
            if (product.status !== "approved") {
                return res.status(400).json({ error: `สินค้า "${product.name}" ไม่พร้อมขาย` });
            }

            const qty = Number(item.qty);
            total += product.price * qty;
            validatedItems.push({
                productId: item.productId,
                name: product.name,
                price: product.price, // ราคาจาก Firestore เท่านั้น ไม่ใช่จาก client
                qty,
            });
        }

        // ---------- บันทึกออเดอร์ ----------
        const orderRef = await shopRef.collection("orders").add({
            customerName: String(customerName).slice(0, 100),
            customerContact: String(customerContact).slice(0, 100),
            items: validatedItems,
            total,
            createdAt: new Date(),
        });

        // Phase 7 จะเพิ่มการ push แจ้งเตือน LINE ตรงนี้

        return res.status(200).json({ orderId: orderRef.id, total });
    } catch (err) {
        console.error("createOrder error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    }
}