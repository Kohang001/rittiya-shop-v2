// api/notifyNewProduct.js
import { adminDb } from "./_firebaseAdmin.js";
import { pushMessage } from "./_line.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { shopId, productName } = req.body;
        if (!shopId || !productName) {
            return res.status(400).json({ error: "missing shopId or productName" });
        }

        const shopSnap = await adminDb.collection("shops").doc(shopId).get();
        if (!shopSnap.exists) return res.status(404).json({ error: "shop not found" });
        const shop = shopSnap.data();

        const adminConfigSnap = await adminDb.collection("config").doc("admin").get();
        const adminLineUserId = adminConfigSnap.exists ? adminConfigSnap.data().lineUserId : null;

        if (adminLineUserId) {
            await pushMessage(adminLineUserId, [
                {
                    type: "text",
                    text:
                        `🆕 มีสิ่งที่รอให้ตรวจสอบ!\n` +
                        `ร้าน: ${shop.name}\n` +
                        `สินค้า: ${productName}\n\n` +
                        `เข้าไปตรวจสอบและอนุมัติได้ที่หน้า \n` +
                        `https://rittiya-shop-v2.vercel.app/admin/shops/`,
                },
            ]);
        }

        return res.status(200).json({ notified: Boolean(adminLineUserId) });
    } catch (err) {
        console.error("notifyNewProduct error:", err);
        return res.status(500).json({ error: "internal error" });
    }
}