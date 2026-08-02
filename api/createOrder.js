// api/createOrder.js — Security Round 2: idempotency, item/qty caps, dedupe, แยก LINE push ไม่ให้กระทบ response
import { adminDb } from "./_firebaseAdmin.js";
import { pushMessage } from "./_line.js";

const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 20;

function isRateLimited(ip) {
    const now = Date.now();
    const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    timestamps.push(now);
    requestLog.set(ip, timestamps);
    return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return forwarded.split(",")[0].trim(); // เอาแค่ IP ตัวแรก ไม่ใช่ทั้งสาย proxy
    return req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: "สั่งซื้อถี่เกินไป กรุณารอสักครู่" });
    }

    try {
        const { shopId, items, customerName, customerContact, slipUrl, clientOrderId } = req.body;

        if (!shopId || typeof shopId !== "string") {
            return res.status(400).json({ error: "ไม่พบร้านค้า" });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "ไม่มีสินค้าในคำสั่งซื้อ" });
        }
        if (items.length > MAX_ITEMS) {
            return res.status(400).json({ error: `สั่งได้ไม่เกิน ${MAX_ITEMS} รายการต่อครั้ง` });
        }
        if (!customerName?.trim() || !customerContact?.trim()) {
            return res.status(400).json({ error: "กรุณากรอกชื่อและช่องทางติดต่อ" });
        }
        if (slipUrl && !slipUrl.startsWith("https://res.cloudinary.com/")) {
            return res.status(400).json({ error: "รูปสลิปไม่ถูกต้อง" });
        }

        const shopRef = adminDb.collection("shops").doc(shopId);

        // ---------- Idempotency: ถ้าเคยสร้าง order จาก clientOrderId นี้แล้ว คืนอันเดิมแทนการสร้างซ้ำ ----------
        // กันปัญหา: ลูกค้ากดยืนยันตอนเน็ตค้าง แล้วเบราว์เซอร์ retry request เดิมซ้ำ
        if (clientOrderId) {
            const existingSnap = await shopRef
                .collection("orders")
                .where("clientOrderId", "==", clientOrderId)
                .limit(1)
                .get();
            if (!existingSnap.empty) {
                const existing = existingSnap.docs[0];
                return res.status(200).json({
                    orderId: existing.id,
                    total: existing.data().total,
                    paymentInfo: existing.data().paymentInfoSnapshot || null,
                    duplicate: true,
                });
            }
        }

        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            return res.status(404).json({ error: "ไม่พบร้านค้านี้" });
        }
        const shop = shopSnap.data();
        if (shop.status !== "approved") {
            return res.status(403).json({ error: "ร้านนี้ยังไม่เปิดให้สั่งซื้อ" });
        }
        if (shop.isOpen === false) {
            return res.status(403).json({ error: "ร้านนี้ปิดรับออเดอร์ชั่วคราว" });
        }

        // ---------- รวม productId ที่ซ้ำกันเข้าด้วยกันก่อน (กัน Firestore read ซ้ำโดยไม่จำเป็น) ----------
        const mergedQtyByProductId = new Map();
        for (const item of items) {
            if (!item.productId || !Number.isFinite(item.qty) || item.qty <= 0) {
                return res.status(400).json({ error: "ข้อมูลสินค้าไม่ถูกต้อง" });
            }
            const qty = Math.floor(item.qty);
            if (qty > MAX_QTY_PER_ITEM) {
                return res.status(400).json({ error: `สั่งสินค้าแต่ละชิ้นได้ไม่เกิน ${MAX_QTY_PER_ITEM} ชิ้น` });
            }
            mergedQtyByProductId.set(item.productId, (mergedQtyByProductId.get(item.productId) || 0) + qty);
        }

        let total = 0;
        const validatedItems = [];

        for (const [productId, qty] of mergedQtyByProductId) {
            if (qty > MAX_QTY_PER_ITEM) {
                return res.status(400).json({ error: `สั่งสินค้าแต่ละชิ้นได้ไม่เกิน ${MAX_QTY_PER_ITEM} ชิ้น` });
            }
            const productRef = shopRef.collection("products").doc(productId);
            const productSnap = await productRef.get();
            if (!productSnap.exists) {
                return res.status(400).json({ error: `ไม่พบสินค้า (${productId})` });
            }
            const product = productSnap.data();
            if (product.status !== "approved") {
                return res.status(400).json({ error: `สินค้า "${product.name}" ไม่พร้อมขาย` });
            }
            total += product.price * qty;
            validatedItems.push({ productId, name: product.name, price: product.price, qty });
        }

        const paymentInfo = {
            promptpayId: shop.promptpayId || null,
            bankName: shop.bankName || null,
            bankAccountNumber: shop.bankAccountNumber || null,
            bankAccountName: shop.bankAccountName || null,
        };

        const orderRef = await shopRef.collection("orders").add({
            customerName: String(customerName).trim().slice(0, 100),
            customerContact: String(customerContact).trim().slice(0, 100),
            items: validatedItems,
            total,
            status: slipUrl ? "slip_uploaded" : "pending",
            slipUrl: slipUrl || null,
            slipUploadedAt: slipUrl ? new Date() : null,
            clientOrderId: clientOrderId || null,
            paymentInfoSnapshot: paymentInfo, // เก็บไว้เผื่อ idempotent retry ต้องคืนค่าเดิมโดยไม่ query shop ซ้ำ
            createdAt: new Date(),
        });

        // ---------- แยก try/catch เฉพาะส่วน LINE ไม่ให้ error ตรงนี้ทำให้ client คิดว่า order สร้างไม่สำเร็จ ----------
        // (ก่อนหน้านี้ถ้า fetch ไป LINE โยน exception จะหลุดไป catch ใหญ่ด้านล่าง กลาย
        //  เป็นตอบ 500 ทั้งที่ order ถูกสร้างไปแล้วจริง — ลูกค้ากดซ้ำแล้วได้ order ซ้ำ)
        if (shop.lineUserId) {
            try {
                const itemsText = validatedItems.map((item) => `- ${item.name} x${item.qty}`).join("\n");
                const messages = [
                    {
                        type: "text",
                        text:
                            (slipUrl
                                ? `💳 มีคำสั่งซื้อใหม่ พร้อมสลิปการโอนเงิน\n`
                                : `🕐 มีคำสั่งซื้อใหม่ — รอลูกค้าชำระเงิน\n`) +
                            `ผู้สั่ง: ${customerName}\n` +
                            `ติดต่อ: ${customerContact}\n\n` +
                            `รายการ:\n${itemsText}\n\n` +
                            `ยอดรวม: ${total.toLocaleString()} บาท` +
                            (slipUrl ? `\n\nกรุณาตรวจสอบสลิปด้านล่าง แล้วกดยืนยันในหน้า Dashboard` : ""),
                    },
                ];
                if (slipUrl) {
                    messages.push({ type: "image", originalContentUrl: slipUrl, previewImageUrl: slipUrl });
                }
                await pushMessage(shop.lineUserId, messages);
            } catch (lineErr) {
                console.error("push LINE ไม่สำเร็จ (ไม่กระทบ order ที่สร้างไปแล้ว):", lineErr);
            }
        }

        return res.status(200).json({ orderId: orderRef.id, total, paymentInfo });
    } catch (err) {
        console.error("createOrder error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    }
}