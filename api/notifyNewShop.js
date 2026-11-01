// api/notifyNewShop.js
import { adminDb } from "./_firebaseAdmin.js";
import { pushMessage } from "./_line.js";

/**
 * แจ้งเตือนไปยัง LINE ของ Admin เมื่อมีร้านค้าใหม่เปิดร้าน
 * พร้อมแสดงรายละเอียดครบถ้วนที่สามารถเปิดเผยได้ (ชื่อร้าน, หมวดหมู่, สโลแกน, ช่องทางติดต่อ, รายการสินค้า)
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { shopId } = req.body;
        if (!shopId) return res.status(400).json({ error: "missing shopId" });

        const shopRef = adminDb.collection("shops").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) return res.status(404).json({ error: "shop not found" });
        const shop = shopSnap.data();

        // ดึงรายการสินค้าเริ่มต้นของร้าน
        const productsSnap = await shopRef.collection("products").get();
        const productList = [];
        productsSnap.forEach((doc) => {
            const p = doc.data();
            productList.push(`• ${p.name} — ${Number(p.price || 0).toLocaleString()} บาท`);
        });

        const adminConfigSnap = await adminDb.collection("config").doc("admin").get();
        const adminLineUserId = adminConfigSnap.exists ? adminConfigSnap.data().lineUserId : null;

        if (adminLineUserId) {
            // จัดเตรียมข้อความรายละเอียดวิธีรับเงิน
            const paymentMethods = [];
            if (shop.promptpayId) {
                paymentMethods.push(`• พร้อมเพย์: ${shop.promptpayId}`);
            }
            if (shop.bankName && shop.bankAccountNumber) {
                paymentMethods.push(`• ธนาคาร: ${shop.bankName} เลขที่ ${shop.bankAccountNumber} (${shop.bankAccountName || "-"})`);
            }
            const paymentText = paymentMethods.length > 0 ? paymentMethods.join("\n") : "• ไม่ได้ระบุ";

            const productText = productList.length > 0
                ? productList.slice(0, 10).join("\n") + (productList.length > 10 ? `\n...และอีก ${productList.length - 10} รายการ` : "")
                : "• ยังไม่มีรายการสินค้า";

            const messageText =
                `🏪 มีร้านค้าใหม่เปิดร้านแล้ว! (ผ่านการตรวจสอบคำ)\n` +
                `━━━━━━━━━━━━━━━\n` +
                `📌 ข้อมูลร้านค้า:\n` +
                `• ชื่อร้าน: ${shop.name}\n` +
                `• หมวดหมู่: ${shop.category || "ทั่วไป"}\n` +
                `• คำอธิบาย/สโลแกน: ${shop.slogan || "-"}\n` +
                `• เบอร์โทรติดต่อ: ${shop.phone}\n` +
                (shop.ig ? `• Instagram: ${shop.ig}\n` : "") +
                `━━━━━━━━━━━━━━━\n` +
                `💳 วิธีรับเงิน:\n` +
                `${paymentText}\n` +
                `━━━━━━━━━━━━━━━\n` +
                `📦 สินค้าเริ่มต้น (${productList.length} ชิ้น):\n` +
                `${productText}\n` +
                `━━━━━━━━━━━━━━━\n` +
                `🔗 ดูหน้าร้านค้า:\n` +
                `https://rittiya-shop-v2.vercel.app/shops/${shopId}`;

            await pushMessage(adminLineUserId, [
                {
                    type: "text",
                    text: messageText,
                },
            ]);
        }

        return res.status(200).json({ success: true, notified: Boolean(adminLineUserId) });
    } catch (err) {
        console.error("notifyNewShop error:", err);
        return res.status(500).json({ error: "internal error" });
    }
}
