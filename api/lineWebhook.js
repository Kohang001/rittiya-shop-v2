// api/lineWebhook.js
import { adminDb } from "./_firebaseAdmin.js";
import { verifyLineSignature, replyMessage, readRawBody } from "./_line.js";

// ต้องปิด body parser อัตโนมัติของ Vercel เพราะต้องใช้ raw body ตรวจ signature
export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const rawBody = await readRawBody(req);
    const signature = req.headers["x-line-signature"];

    if (!verifyLineSignature(rawBody, signature)) {
        return res.status(401).json({ error: "invalid signature" });
    }

    const body = JSON.parse(rawBody);

    for (const event of body.events || []) {
        if (event.type !== "message" || event.message.type !== "text") continue;

        const text = event.message.text.trim();
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        try {
            // ---------- 1. เช็คว่าเป็นรหัสผูกบัญชี Admin เฉพาะบุคคล (ADMIN-xxxxxx) ไหม ----------
            const adminSnap = await adminDb
                .collection("admins")
                .where("lineLinkCode", "==", text)
                .limit(1)
                .get();

            if (!adminSnap.empty) {
                const adminDoc = adminSnap.docs[0];
                const adminData = adminDoc.data();
                const roleLabel = adminData.role === "super" ? "Super Admin" : "Normal Admin";

                await adminDoc.ref.update({
                    lineUserId: userId,
                    lineLinkCode: null, // เคลียร์รหัสทันทีหลังเชื่อมต่อสำเร็จ (One-Time Pairing)
                    lineLinkedAt: new Date(),
                });

                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text: `✅ เชื่อมต่อบัญชีผู้ดูแลระบบ (${roleLabel}) สำเร็จแล้ว!\nคุณจะได้รับการแจ้งเตือนร้านใหม่ สินค้าใหม่ และรายงานข้อผิดพลาดของระบบที่นี่`,
                    },
                ]);
                continue;
            }

            // ---------- 2. เช็คว่าเป็นรหัสผูกบัญชี Master Admin เดิมไหม (Fallback) ----------
            if (process.env.ADMIN_LINE_LINK_CODE && text === process.env.ADMIN_LINE_LINK_CODE) {
                await adminDb.collection("config").doc("admin").set({ lineUserId: userId });
                await replyMessage(replyToken, [
                    { type: "text", text: "✅ ผูกบัญชี Master Admin สำเร็จแล้ว จะได้รับแจ้งเตือนร้านใหม่ที่นี่" },
                ]);
                continue;
            }

            // ---------- 3. ตรวจสอบรหัสผูกร้านค้า (Seller Store Pairing) ----------
            const shopsSnap = await adminDb
                .collection("shops")
                .where("lineLinkCode", "==", text)
                .limit(1)
                .get();

            if (shopsSnap.empty) {
                await replyMessage(replyToken, [
                    { type: "text", text: "ไม่พบรหัสนี้ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง" },
                ]);
                continue;
            }

            const shopDoc = shopsSnap.docs[0];
            // เคลียร์รหัสทันทีหลังเชื่อมต่อสำเร็จ (One-Time Pairing Code Security)
            await shopDoc.ref.update({
                lineUserId: userId,
                lineLinkCode: null,
                lineLinkedAt: new Date(),
            });

            await replyMessage(replyToken, [
                {
                    type: "text",
                    text: `✅ เชื่อมต่อร้าน "${shopDoc.data().name}" สำเร็จแล้ว จะได้รับแจ้งเตือนออเดอร์ที่นี่`,
                },
            ]);
        } catch (err) {
            console.error("lineWebhook error:", err);
        }
    }

    return res.status(200).json({ ok: true });
}
