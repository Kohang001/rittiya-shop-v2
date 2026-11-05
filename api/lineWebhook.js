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
            {
                type: "action",
                action: {
                    type: "message",
                    label: "🔌 ยกเลิกผูก LINE",
                    text: "unlink",
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
            // 0. คำสั่ง: ยกเลิกการเชื่อมต่อ LINE (Unlink Command — ใช้คำเดียว 'unlink')
            // =========================================================================
            const isUnlinkCommand = lowerText === "unlink" || postbackData === "action=unlink";

            if (isUnlinkCommand) {
                // 0.1 ตรวจสอบว่าผูกกับร้านค้าหรือไม่
                const shopSnap = await adminDb
                    .collection("shops")
                    .where("lineUserId", "==", userId)
                    .limit(1)
                    .get();

                if (!shopSnap.empty) {
                    const shopDoc = shopSnap.docs[0];
                    const shop = shopDoc.data();
                    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

                    await shopDoc.ref.update({
                        lineUserId: null,
                        lineLinkCode: newCode,
                        updatedAt: new Date(),
                    });

                    await adminDb.collection("adminLogs").add({
                        action: "line_shop_unlinked",
                        targetType: "shop",
                        targetId: shopDoc.id,
                        targetName: shop.name,
                        detail: `ร้านค้า "${shop.name}" ยกเลิกการเชื่อมต่อ LINE ผ่านคำสั่ง unlink (ออกรหัสใหม่เรียบร้อยแล้ว)`,
                        status: "warning",
                        actorEmail: `ร้าน: ${shop.name}`,
                        actorUid: userId,
                        createdAt: new Date(),
                    }).catch(() => {});

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `🔌 ยกเลิกการเชื่อมต่อ LINE กับร้าน "${shop.name}" สำเร็จแล้ว!\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `ระบบจะไม่ส่งการแจ้งเตือนออเดอร์มายังแชทนี้อีกต่อไป\n\n` +
                                `🔑 รหัสเชื่อมต่อชุดใหม่ของคุณคือ: ${newCode}\n` +
                                `(รหัสใหม่นี้จะแสดงในหน้าแดชบอร์ดร้านค้าบนเว็บด้วย คุณสามารถนำไปเชื่อมต่อใหม่ได้ตลอดเวลาครับ)`,
                        },
                    ]);
                    continue;
                }

                // 0.2 ตรวจสอบว่าผูกกับบัญชีแอดมินหรือไม่
                const adminSnap = await adminDb
                    .collection("admins")
                    .where("lineUserId", "==", userId)
                    .limit(1)
                    .get();

                if (!adminSnap.empty) {
                    const adminDoc = adminSnap.docs[0];
                    const adminData = adminDoc.data();
                    const roleLabel = adminData.role === "super" ? "Super Admin" : "Normal Admin";
                    const newCode = "ADMIN-" + Math.floor(100000 + Math.random() * 900000);

                    await adminDoc.ref.update({
                        lineUserId: null,
                        lineLinkCode: newCode,
                        updatedAt: new Date(),
                    });

                    // หากเป็น Super Admin ให้เคลียร์ใน config/admin ด้วยถ้า lineUserId ตรงกัน
                    const configSnap = await adminDb.collection("config").doc("admin").get();
                    if (configSnap.exists && configSnap.data()?.lineUserId === userId) {
                        await adminDb.collection("config").doc("admin").set({ lineUserId: null }, { merge: true });
                    }

                    await adminDb.collection("adminLogs").add({
                        action: "line_admin_unlinked",
                        targetType: "admin",
                        targetId: adminDoc.id,
                        targetName: adminData.email || "Admin",
                        detail: `ผู้ดูแลระบบ (${roleLabel}) "${adminData.email}" ยกเลิกการเชื่อมต่อ LINE ผ่านคำสั่ง unlink`,
                        status: "warning",
                        actorEmail: adminData.email || "Admin",
                        actorUid: adminDoc.id,
                        createdAt: new Date(),
                    }).catch(() => {});

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `🔌 ยกเลิกการเชื่อมต่อ LINE กับบัญชีผู้ดูแลระบบ (${adminData.email}) เรียบร้อยแล้ว!\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `ระบบจะไม่ส่งการแจ้งเตือนแอดมินมายังแชทนี้อีกต่อไป\n\n` +
                                `🔑 รหัสเชื่อมต่อชุดใหม่ของคุณคือ: ${newCode}\n` +
                                `(รหัสใหม่นี้จะแสดงในหน้าผู้ดูแลระบบบนเว็บด้วยครับ)`,
                        },
                    ]);
                    continue;
                }

                // 0.3 ตรวจสอบว่าผูกกับบัญชีผู้ใช้ทั่วไปหรือไม่
                const userSnap = await adminDb
                    .collection("users")
                    .where("lineUserId", "==", userId)
                    .limit(1)
                    .get();

                if (!userSnap.empty) {
                    const userDoc = userSnap.docs[0];
                    const userData = userDoc.data();
                    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

                    await userDoc.ref.update({
                        lineUserId: null,
                        lineLinkCode: newCode,
                        updatedAt: new Date(),
                    });

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `🔌 ยกเลิกการเชื่อมต่อ LINE กับบัญชีผู้ใช้ "${userData.displayName || userData.email}" สำเร็จแล้ว!\n` +
                                `ระบบจะไม่ส่งการแจ้งเตือนสถานะออเดอร์มายังแชทนี้อีกต่อไป`,
                        },
                    ]);
                    continue;
                }

                // หากยังไม่ได้ผูกกับบัญชีใดๆ
                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text: `⚠️ บัญชี LINE นี้ยังไม่ได้เชื่อมต่อกับร้านค้าหรือบัญชีผู้ดูแลระบบใดๆ ในระบบ Rittiya Shop ครับ`,
                    },
                ]);
                continue;
            }

            // =========================================================================
            // 1. ตรวจสอบรหัสผูกบัญชี Admin เฉพาะบุคคล (รูปแบบเดียวตายตัว: ADMIN-xxxxxx)
            // =========================================================================
            const cleanAdminCode = incomingText.toUpperCase();
            if (/^ADMIN-\d{6}$/.test(cleanAdminCode)) {
                const adminSnap = await adminDb
                    .collection("admins")
                    .where("lineLinkCode", "==", cleanAdminCode)
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

                    // บันทึก Activity Log สำหรับการเชื่อมต่อ Admin
                    await adminDb.collection("adminLogs").add({
                        action: "line_admin_linked",
                        targetType: "admin",
                        targetId: adminDoc.id,
                        targetName: adminData.email || "Admin",
                        detail: `ผู้ดูแลระบบ (${roleLabel}) "${adminData.email}" ผูกบัญชี LINE OA สำเร็จ (รหัสใช้ครั้งเดียวถูกทำลายแล้ว)`,
                        status: "success",
                        actorEmail: adminData.email || "Admin",
                        actorUid: adminDoc.id,
                        createdAt: new Date(),
                    }).catch(() => {});

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `✅ เชื่อมต่อบัญชีผู้ดูแลระบบ (${roleLabel}) สำเร็จแล้ว!\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `คุณจะได้รับการแจ้งเตือนร้านใหม่ สินค้าใหม่ และรายงานข้อผิดพลาดของระบบที่นี่\n\n` +
                                `💡 หากต้องการยกเลิกการเชื่อมต่อในอนาคต ให้พิมพ์คำว่า "unlink" ในแชทนี้ครับ`,
                        },
                    ]);
                    continue;
                } else {
                    // ส่งรหัส ADMIN-xxxxxx แต่ไม่ถูกต้องหรือถูกใช้งานไปแล้ว
                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `⚠️ ไม่พบรหัส Admin "${cleanAdminCode}" ในระบบ หรือรหัสนี้ถูกใช้งานไปแล้ว\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `เพื่อความปลอดภัย รหัสเชื่อมต่อเป็นแบบใช้ครั้งเดียวแล้วทิ้ง (One-Time Code)\n` +
                                `กรุณากดขอรหัสชุดใหม่จากหน้าจัดการแอดมินบนเว็บไซต์ครับ`,
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

                // บันทึก Activity Log ของร้านค้า
                await adminDb.collection("adminLogs").add({
                    action: "line_shop_closed",
                    targetType: "shop",
                    targetId: shopDoc.id,
                    targetName: shop.name,
                    detail: `ผู้ขายสั่ง "ปิดรับออเดอร์" ร้าน "${shop.name}" ผ่าน LINE Official Account`,
                    status: "warning",
                    actorEmail: `LINE: ${shop.name}`,
                    actorUid: userId,
                    createdAt: new Date(),
                }).catch(() => {});

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

                // บันทึก Activity Log ของร้านค้า
                await adminDb.collection("adminLogs").add({
                    action: "line_shop_opened",
                    targetType: "shop",
                    targetId: shopDoc.id,
                    targetName: shop.name,
                    detail: `ผู้ขายสั่ง "เปิดรับออเดอร์" ร้าน "${shop.name}" ผ่าน LINE Official Account`,
                    status: "success",
                    actorEmail: `LINE: ${shop.name}`,
                    actorUid: userId,
                    createdAt: new Date(),
                }).catch(() => {});

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
            // 5. ตรวจสอบรหัสเชื่อมต่อ (One-Time Pairing Code — เลข 6 หลัก)
            // =========================================================================
            if (/^\d{6}$/.test(incomingText)) {
                // 5.1 ตรวจสอบร้านค้า (Shops)
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

                    // บันทึก Activity Log สำหรับการผูก LINE ร้านค้า
                    await adminDb.collection("adminLogs").add({
                        action: "line_shop_linked",
                        targetType: "shop",
                        targetId: shopDoc.id,
                        targetName: shop.name,
                        detail: `ร้านค้า "${shop.name}" เชื่อมต่อ LINE Official Account สำเร็จ (รหัสใช้ครั้งเดียวถูกทำลายแล้ว)`,
                        status: "success",
                        actorEmail: `ร้าน: ${shop.name}`,
                        actorUid: userId,
                        createdAt: new Date(),
                    }).catch(() => {});

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `🎉 เชื่อมต่อร้าน "${shop.name}" สำเร็จแล้ว!\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `คุณจะได้รับแจ้งเตือนออเดอร์ใหม่พร้อมรูปสลิปที่นี่ และสามารถแตะปุ่มด้านล่างเพื่อ "เปิด" หรือ "ปิด" รับออเดอร์ได้ตลอดเวลาครับ\n\n` +
                                `💡 หากต้องการยกเลิกการเชื่อมต่อในอนาคต ให้พิมพ์คำว่า "unlink" ในแชทนี้ครับ`,
                            quickReply: createShopQuickReply(isOpen),
                        },
                    ]);
                    continue;
                }

                // 5.2 ตรวจสอบผู้ใช้ทั่วไป (Users / Buyers)
                const usersSnap = await adminDb
                    .collection("users")
                    .where("lineLinkCode", "==", incomingText)
                    .limit(1)
                    .get();

                if (!usersSnap.empty) {
                    const userDoc = usersSnap.docs[0];
                    const userData = userDoc.data();
                    const userName = userData.displayName || userData.email || "สมาชิก Rittiya Shop";

                    await userDoc.ref.update({
                        lineUserId: userId,
                        lineLinkCode: null,
                        lineLinkedAt: new Date(),
                    });

                    // บันทึก Activity Log สำหรับผู้ใช้
                    await adminDb.collection("adminLogs").add({
                        action: "line_user_linked",
                        targetType: "user",
                        targetId: userDoc.id,
                        targetName: userName,
                        detail: `ผู้ใช้ทั่วไป "${userName}" เชื่อมต่อ LINE Official Account สำเร็จ (รหัสใช้ครั้งเดียวถูกทำลายแล้ว)`,
                        status: "success",
                        actorEmail: userData.email || "User",
                        actorUid: userDoc.id,
                        createdAt: new Date(),
                    }).catch(() => {});

                    await replyMessage(replyToken, [
                        {
                            type: "text",
                            text:
                                `🎉 เชื่อมต่อบัญชีผู้ใช้ "${userName}" สำเร็จแล้ว!\n` +
                                `━━━━━━━━━━━━━━━\n` +
                                `คุณจะได้รับการแจ้งเตือนสถานะคำสั่งซื้อจากร้านค้าในโรงเรียนผ่านทางแชทนี้ครับ`,
                        },
                    ]);
                    continue;
                }

                // หากส่งตัวเลข 6 หลักแต่ไม่พบทั้งร้านค้าและผู้ใช้ (หรือรหัสถูกใช้ไปแล้ว)
                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text:
                            `⚠️ ไม่พบรหัสเชื่อมต่อ 6 หลักนี้ หรือรหัสถูกใช้งานไปแล้ว\n` +
                            `━━━━━━━━━━━━━━━\n` +
                            `เพื่อความปลอดภัย รหัสเชื่อมต่อเป็นแบบ "ใช้ครั้งเดียวแล้วทิ้ง" (One-Time Code)\n` +
                            `หากยังไม่ได้เชื่อมต่อ กรุณากดขอรหัสชุดใหม่จากหน้าเว็บครับ`,
                    },
                ]);
                continue;
            }

            // =========================================================================
            // 6. กรณีข้อความอื่นๆ ที่ไม่ตรงกับคอมมานปกติ (Guidance Fallback)
            // =========================================================================
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
                            `❓ ไม่พบคำสั่งที่คุณพิมพ์\n` +
                            `━━━━━━━━━━━━━━━\n` +
                            `ร้านค้า: "${shop.name}" (${isOpen ? "🟢 เปิดรับออเดอร์" : "🔴 ปิดรับออเดอร์"})\n\n` +
                            `คำสั่งที่สามารถใช้งานได้:\n` +
                            `• พิมพ์ "เปิดรับออเดอร์" หรือ "เปิดร้าน"\n` +
                            `• พิมพ์ "ปิดรับออเดอร์" หรือ "ปิดร้าน"\n` +
                            `• พิมพ์ "สถานะร้าน"\n\n` +
                            `หรือแตะปุ่มเมนูลัดด้านล่างนี้ได้เลยครับ`,
                        quickReply: createShopQuickReply(isOpen),
                    },
                ]);
            } else {
                await replyMessage(replyToken, [
                    {
                        type: "text",
                        text:
                            `❓ ไม่พบคำสั่งที่คุณพิมพ์ในระบบ\n` +
                            `━━━━━━━━━━━━━━━\n` +
                            `คำสั่งที่ระบบรองรับ:\n` +
                            `• ส่งรหัสเชื่อมต่อ 6 หลักจากหน้าร้านค้า หรือหน้าโปรไฟล์เพื่อผูกบัญชี\n` +
                            `• เลือกชมร้านค้าและสั่งซื้อได้ที่ https://rittiya-shop-v2.vercel.app`,
                    },
                ]);
            }
        } catch (err) {
            console.error("lineWebhook error:", err);
        }
    }

    return res.status(200).json({ ok: true });
}
