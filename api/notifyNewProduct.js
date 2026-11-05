// api/notifyNewProduct.js
import { adminDb } from "./_firebaseAdmin.js";
import { notifyAllAdmins } from "./_line.js";

/**
 * แจ้งเตือนไปยัง LINE ของ Admin ทุกคนที่เชื่อมต่อไว้ เมื่อร้านค้าเพิ่มสินค้าใหม่
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { shopId, productName, productDesc, price } = req.body;
        if (!shopId || !productName) {
            return res.status(400).json({ error: "missing shopId or productName" });
        }

        const shopSnap = await adminDb.collection("shops").doc(shopId).get();
        if (!shopSnap.exists) return res.status(404).json({ error: "shop not found" });
        const shop = shopSnap.data();

        const formattedPrice = Number(price || 0).toLocaleString();
        const messageText =
            `🛍️ มีสินค้าใหม่เพิ่มในร้านค้า!\n` +
            `━━━━━━━━━━━━━━━\n` +
            `🏪 ร้าน: ${shop.name} (${shop.category || "ทั่วไป"})\n` +
            `📦 สินค้า: ${productName}\n` +
            `💰 ราคา: ${formattedPrice} บาท\n` +
            (productDesc ? `📝 รายละเอียด: ${productDesc}\n` : "") +
            `━━━━━━━━━━━━━━━\n` +
            `🔗 ดูหน้าร้านค้า:\n` +
            `https://rittiya-shop-v2.vercel.app/shops/${shopId}`;

        await notifyAllAdmins(adminDb, [
            {
                type: "text",
                text: messageText,
            },
        ]);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("notifyNewProduct error:", err);
        return res.status(500).json({ error: "internal error" });
    }
}
