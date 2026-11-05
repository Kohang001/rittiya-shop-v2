// api/lineWebhook.js
// ระบบ Webhook สำหรับ LINE Official Account
// รองรับ:
// 1. ผูกบัญชี Admin (ADMIN-xxxxxx)
// 2. ผูกบัญชีร้านค้า (6 หลัก)
// 3. สั่ง เปิดรับออเดอร์ / ปิดรับออเดอร์ ร้านค้าผ่าน LINE โดยตรง (Sync กับหน้าเว็บทันที)
// 4. เช็คสถานะร้านค้า พร้อมปุ่ม Quick Reply เมนูลัดสไตล์เต่าบิน
// 5. รองรับทั้งการพิมพ์ข้อความ และกดปุ่มจาก Rich Menu / Postback

import { adminDb } from "./_firebaseAdmin.js";
import { verifyLineSignature, replyMessage, readRawBody } from "./_line.js";

// ต้องปิด body parser อัตโนมัติของ Vercel เพราะต้องใช้ raw body ตรวจ signature
export const config = {
    api: { bodyParser: false },
};

/**
 * สร้าง Quick Reply เมนูลัดด้านล่างแชท เพื่อให้ผู้ขายแตะสลับเปิด/ปิดร้านได้สะดวก
 */
function createShopQuickReply(isOpen) {
    return {
        items: [
            {
                type: "action",
                action: {
                    type: "message",
                    label: isOpen ? "🔴 ปิดรับออเดอร์" : "🟢 เปิดรับออเดอร์",
                    text: isOpen ? "ปิดรับออเดอร์" : "เปิดรับออเดอร์",
                },
            },
            {
                type: "action",
                action: {
                    type: "message",
                    label: "🏪 เช็คสถานะร้าน",
                    text: "สถานะร้าน",
                },
            },
            {
                type: "action",
                action: {
                    type: "uri",
                    label: "📊 แดชบอร์ดร้าน",
                    uri: "https://rittiya-shop-v2.vercel.app/seller/dashboard",
                },
            },
        ],
    };
}

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
        const userId = event.source?.userId;
        const replyToken = event.replyToken;
        if (!userId || !replyToken) continue;

        let incomingText = "";
        let postbackData = "";

        if (event.type === "message" && event.message?.type === "text") {
            incomingText = event.message.text.trim();
        } else if (event.type === "postback") {
            postbackData = event.postback?.data || "";
        } else {
            // ไม่ใช่ข้อความหรือ postback ข้ามไป
            continue;
        }

        const lowerText = incomingText.toLowerCase();

        try {
            // =========================================================================
            // 1. ตรวจสอบรหัสผูกบัญชี Admin เฉพาะบุคคล (ADMIN-xxxxxx)
            // =========================================================================
            if (incomingText.startsWith("ADMIN-") || incomingText.startsWith("admin-")) {
                const adminSnap = await adminDb
                    .collection("admins")
                    .where("lineLinkCode", "==", incomingText.toUpperCase())
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

                    // หากเป็น Super Admin ให้ซิงค์ลง config/admin ด้วย
                    if (adminData.role === "super" || adminData.email?.toLowerCase() === "nathwrrthsumphlxy@gmail.com") {
                        await adminDb.collection("config").doc("admin").set({ lineUserId: userId }, { merge: true });
                    }

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text: `✅ เชื่อมต่อบัญชีผู้ดูแลระบบ (${roleLabel}) สำเร็จแล้ว!\nคุณจะได้รับการแจ้งเตือนร้านใหม่ สินค้าใหม่ และรายงานข้อผิดพลาดของระบบที่นี่`,
                        },
                    ]);
                    continue;
                }
            }

            // Fallback รหัส Master Admin จาก Environment
            if (process.env.ADMIN_LINE_LINK_CODE && incomingText === process.env.ADMIN_LINE_LINK_CODE) {
                await adminDb.collection("config").doc("admin").set({ lineUserId: userId }, { merge: true });
                await replyMessage(replyToken, [
                    { type: "text", text: "✅ ผูกบัญชี Master Admin สำเร็จแล้ว จะได้รับแจ้งเตือนร้านใหม่ที่นี่" },
                ]);
                continue;
            }

            // =========================================================================
            // 2. คำสั่ง: ปิดรับออเดอร์ร้านค้า (Close Store)
            // =========================================================================
            const isCloseCommand =
                incomingText === "ปิดรับออเดอร์" ||
                incomingText === "ปิดร้าน" ||
                incomingText === "ปิด" ||
                lowerText === "close" ||
                lowerText === "closed" ||
                postbackData === "action=close_shop" ||
                postbackData === "close";

            if (isCloseCommand) {
                const shopSnap = await adminDb
                    .collection("shops")
                    .where("lineUserId", "==", userId)
                    .limit(1)
                    .get();

                if (shopSnap.empty) {
                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text: "⚠️ คุณยังไม่ได้เชื่อมต่อบัญชีร้านค้า\nกรุณานำรหัสเชื่อมต่อ 6 หลักจากหน้าร้านค้าของคุณมาพิมพ์ในแชทนี้เพื่อเชื่อมต่อก่อนครับ",
                        },
                    ]);
                    continue;
                }

                const shopDoc = shopSnap.docs[0];
                const shop = shopDoc.data();

                // อัปเดตสถานะเป็นปิดร้านใน Firestore (หน้าเว็บและระบบสั่งซื้อจะปิดทันที)
                await shopDoc.ref.update({
                    isOpen: false,
                    updatedAt: new Date(),
                });

                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text:
                            `🔴 ปิดรับออเดอร์ร้าน "${shop.name}" ชั่วคราวเรียบร้อยแล้ว!\n` +
                            `━━━━━━━━━━━━━━━\n` +
                            `ลูกค้าจะไม่สามารถกดสั่งซื้อสินค้าบนเว็บไซต์ได้ในขณะนี้\n` +
                            `แตะปุ่ม "🟢 เปิดรับออเดอร์" ด้านล่างเมื่อพร้อมขายอีกครั้งครับ`,
                        quickReply: createShopQuickReply(false),
                    },
                ]);
                continue;
            }

            // =========================================================================
            // 3. คำสั่ง: เปิดรับออเดอร์ร้านค้า (Open Store)
            // =========================================================================
            const isOpenCommand =
                incomingText === "เปิดรับออเดอร์" ||
                incomingText === "เปิดร้าน" ||
                incomingText === "เปิด" ||
                lowerText === "open" ||
                postbackData === "action=open_shop" ||
                postbackData === "open";

            if (isOpenCommand) {
                const shopSnap = await adminDb
                    .collection("shops")
                    .where("lineUserId", "==", userId)
                    .limit(1)
                    .get();

                if (shopSnap.empty) {
                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text: "⚠️ คุณยังไม่ได้เชื่อมต่อบัญชีร้านค้า\nกรุณานำรหัสเชื่อมต่อ 6 หลักจากหน้าร้านค้าของคุณมาพิมพ์ในแชทนี้เพื่อเชื่อมต่อก่อนครับ",
                        },
                    ]);
                    continue;
                }

                const shopDoc = shopSnap.docs[0];
                const shop = shopDoc.data();

                // อัปเดตสถานะเป็นเปิดร้านใน Firestore (หน้าเว็บเปิดรับออเดอร์ทันที)
                await shopDoc.ref.update({
                    isOpen: true,
                    updatedAt: new Date(),
                });

                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text:
                            `🟢 เปิดรับออเดอร์ร้าน "${shop.name}" เรียบร้อยแล้ว!\n` +
                            `━━━━━━━━━━━━━━━\n` +
                            `ร้านค้าเปิดรับออเดอร์บนเว็บไซต์ตามปกติ ลูกค้าสามารถเลือกชมและกดสั่งซื้อได้ทันทีครับ`,
                        quickReply: createShopQuickReply(true),
                    },
                ]);
                continue;
            }

            // =========================================================================
            // 4. คำสั่ง: เช็คสถานะร้านค้า (Store Status)
            // =========================================================================
            const isStatusCommand =
                incomingText === "สถานะร้าน" ||
                incomingText === "เช็คสถานะ" ||
                incomingText === "เมนู" ||
                lowerText === "status" ||
                postbackData === "action=status_shop";

            if (isStatusCommand) {
                const shopSnap = await adminDb
                    .collection("shops")
                    .where("lineUserId", "==", userId)
                    .limit(1)
                    .get();

                if (!shopSnap.empty) {
                    const shopDoc = shopSnap.docs[0];
                    const shop = shopDoc.data();
                    const isOpen = shop.isOpen !== false;
                    const statusText = isOpen ? "🟢 เปิดรับออเดอร์อยู่" : "🔴 ปิดรับออเดอร์ชั่วคราว";

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `🏪 ข้อมูลร้าน: ${shop.name}\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `📌 สถานะร้าน: ${statusText}\n` +
                                `📂 หมวดหมู่: ${shop.category || "ทั่วไป"}\n` +
                                `📞 เบอร์ติดต่อ: ${shop.phone || "-"}\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `🔗 หน้าร้านค้าบนเว็บ:\n` +
                                `https://rittiya-shop-v2.vercel.app/shops/${shopDoc.id}`,
                            quickReply: createShopQuickReply(isOpen),
                        },
                    ]);
                    continue;
                }
            }

            // =========================================================================
            // 5. ตรวจสอบรหัสผูกร้านค้า (Seller Store Pairing Code — เลข 6 หลัก)
            // =========================================================================
            if (/^\d{6}$/.test(incomingText)) {
                const shopsSnap = await adminDb
                    .collection("shops")
                    .where("lineLinkCode", "==", incomingText)
                    .limit(1)
                    .get();

                if (!shopsSnap.empty) {
                    const shopDoc = shopsSnap.docs[0];
                    const shop = shopDoc.data();
                    const isOpen = shop.isOpen !== false;

                    // เคลียร์รหัสทันทีหลังเชื่อมต่อสำเร็จ (One-Time Pairing Code Security)
                    await shopDoc.ref.update({
                        lineUserId: userId,
                        lineLinkCode: null,
                        lineLinkedAt: new Date(),
                    });

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `🎉 เชื่อมต่อร้าน "${shop.name}" สำเร็จแล้ว!\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `คุณจะได้รับแจ้งเตือนออเดอร์ใหม่พร้อมรูปสลิปที่นี่ และสามารถแตะปุ่มด้านล่างเพื่อ "เปิด" หรือ "ปิด" รับออเดอร์ได้ตลอดเวลาครับ`,
                            quickReply: createShopQuickReply(isOpen),
                        },
                    ]);
                    continue;
                }
            }

            // =========================================================================
            // 6. กรณีข้อความอื่นๆ (Helpful Fallback พร้อม Quick Reply)
            // =========================================================================
            // เช็คว่าผู้ใช้นี้ผูกร้านค้าไว้หรือยัง
            const connectedShopSnap = await adminDb
                .collection("shops")
                .where("lineUserId", "==", userId)
                .limit(1)
                .get();

            if (!connectedShopSnap.empty) {
                const shop = connectedShopSnap.docs[0].data();
                const isOpen = shop.isOpen !== false;

                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text:
                            `👋 สวัสดีครับคุณแม่ค้า/พ่อค้า ร้าน "${shop.name}"\n` +
                            `สถานะปัจจุบัน: ${isOpen ? "🟢 เปิดรับออเดอร์อยู่" : "🔴 ปิดรับออเดอร์ชั่วคราว"}\n\n` +
                            `คุณสามารถแตะปุ่มเมนูด้านล่างนี้เพื่อสั่งเปิด/ปิดรับออเดอร์ หรือเช็คสถานะร้านได้ทันทีครับ`,
                        quickReply: createShopQuickReply(isOpen),
                    },
                ]);
            } else {
                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text:
                            `👋 ยินดีต้อนรับสู่ Rittiya Shop Official\n` +
                            `━━━━━━━━━━━━━━━\n` +
                            `หากคุณเป็นผู้ขาย กรุณานำรหัสเชื่อมต่อ 6 หลักจากหน้าร้านค้ามาพิมพ์ในแชทนี้เพื่อเชื่อมต่อระบบแจ้งเตือนและเมนูควบคุมร้านค้าครับ`,
                    },
                ]);
            }
        } catch (err) {
            console.error("lineWebhook error:", err);
        }
    }

    return res.status(200).json({ ok: true });
}
