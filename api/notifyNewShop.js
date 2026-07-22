// api/notifyNewShop.js
import { adminDb } from "./_firebaseAdmin.js";
import { pushMessage } from "./_line.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { shopId } = req.body;
        if (!shopId) return res.status(400).json({ error: "missing shopId" });

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
                        `🆕 มีร้านค้าใหม่สมัครเข้ามา!\n` +
                        `ชื่อร้าน: ${shop.name}\n` +
                        `เบอร์ติดต่อ: ${shop.phone}\n\n` +
                        `เข้าไปตรวจสอบและอนุมัติได้ที่หน้า Admin`,
                },
            ]);
        }

        // ไม่ถือเป็น error ร้ายแรงถ้า admin ยังไม่ผูก LINE ไว้ — แค่ไม่มีใครได้รับแจ้งเตือนเฉยๆ
        return res.status(200).json({ notified: Boolean(adminLineUserId) });
    } catch (err) {
        console.error("notifyNewShop error:", err);
        return res.status(500).json({ error: "internal error" });
    }
}