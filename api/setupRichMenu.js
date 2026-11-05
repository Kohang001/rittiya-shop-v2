// api/setupRichMenu.js
// API สำหรับผู้ดูแลระบบในการตรวจสอบและสร้าง LINE Rich Menu อัตโนมัติ
import { verifySuperAdminRequest } from "./_firebaseAdmin.js";

const LINE_API_BASE = "https://api.line.me/v2/bot";
const LINE_DATA_API_BASE = "https://api-data.line.me/v2/bot";

export default async function handler(req, res) {
    const admin = await verifySuperAdminRequest(req);
    if (!admin) {
        return res.status(403).json({ error: "สงวนสิทธิ์เฉพาะ Super Admin เท่านั้น" });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
        return res.status(500).json({ error: "ไม่พบ LINE_CHANNEL_ACCESS_TOKEN ใน Environment Variables" });
    }

    // GET: ดูรายการ Rich Menu ทั้งหมดที่มีอยู่ใน LINE OA
    if (req.method === "GET") {
        try {
            const listRes = await fetch(`${LINE_API_BASE}/richmenu/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const listData = await listRes.json();

            const defaultRes = await fetch(`${LINE_API_BASE}/user/all/richmenu`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const defaultData = defaultRes.ok ? await defaultRes.json() : null;

            return res.status(200).json({
                richmenus: listData.richmenus || [],
                defaultRichMenuId: defaultData?.richMenuId || null,
            });
        } catch (err) {
            console.error("fetch rich menu list error:", err);
            return res.status(500).json({ error: err.message });
        }
    }

    // POST: สร้าง Rich Menu โครงสร้าง 3 ปุ่ม สไตล์เต่าบิน
    // [แถวบน]: ตรวจสอบสถานะร้านค้า
    // [แถวล่างซ้าย]: 🟢 เปิดรับออเดอร์
    // [แถวล่างขวา]: 🔴 ปิดรับออเดอร์
    if (req.method === "POST") {
        try {
            const { action, richMenuId, imageBase64 } = req.body || {};

            // กรณีต้องการลบ Rich Menu เก่า
            if (action === "delete" && richMenuId) {
                const delRes = await fetch(`${LINE_API_BASE}/richmenu/${richMenuId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                return res.status(200).json({ success: delRes.ok });
            }

            // กรณีตั้งให้ Rich Menu นี้เป็น Default ให้ผู้ใช้ทุกคน
            if (action === "set_default" && richMenuId) {
                const setRes = await fetch(`${LINE_API_BASE}/user/all/richmenu/${richMenuId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                return res.status(200).json({ success: setRes.ok });
            }

            // กรณีอัปโหลดรูปภาพให้กับ Rich Menu
            if (action === "upload_image" && richMenuId && imageBase64) {
                const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
                const uploadRes = await fetch(`${LINE_DATA_API_BASE}/richmenu/${richMenuId}/content`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "image/png",
                        Authorization: `Bearer ${token}`,
                    },
                    body: buffer,
                });
                return res.status(200).json({ success: uploadRes.ok });
            }

            // สร้างโครงสร้าง Rich Menu มาตรฐาน (ขนาด 2500 x 1686)
            const richMenuStructure = {
                size: { width: 2500, height: 1686 },
                selected: true,
                name: "Rittiya Shop Seller Controller",
                chatBarText: "เมนูร้านค้า ⚡",
                areas: [
                    // โซนที่ 1: แถวบนทั้งหมด (เช็คสถานะร้าน & ลิงก์หน้าร้าน)
                    {
                        bounds: { x: 0, y: 0, width: 2500, height: 843 },
                        action: {
                            type: "message",
                            text: "สถานะร้าน",
                        },
                    },
                    // โซนที่ 2: แถวล่างซ้าย (🟢 เปิดรับออเดอร์)
                    {
                        bounds: { x: 0, y: 843, width: 1250, height: 843 },
                        action: {
                            type: "message",
                            text: "เปิดรับออเดอร์",
                        },
                    },
                    // โซนที่ 3: แถวล่างขวา (🔴 ปิดรับออเดอร์)
                    {
                        bounds: { x: 1250, y: 843, width: 1250, height: 843 },
                        action: {
                            type: "message",
                            text: "ปิดรับออเดอร์",
                        },
                    },
                ],
            };

            const createRes = await fetch(`${LINE_API_BASE}/richmenu`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(richMenuStructure),
            });

            const createData = await createRes.json();
            if (!createRes.ok) {
                return res.status(400).json({ error: createData.message || "สร้าง Rich Menu ไม่สำเร็จ" });
            }

            return res.status(200).json({
                success: true,
                richMenuId: createData.richMenuId,
                instructions:
                    "สร้าง Rich Menu สำเร็จแล้ว! คุณสามารถนำ richMenuId ไปอัปโหลดรูปภาพขนาด 2500x1686 หรือเปิด LINE Official Account Manager (manager.line.biz) เพื่อเลือกรูปภาพและตั้งเป็น Default ได้ทันที",
            });
        } catch (err) {
            console.error("create rich menu error:", err);
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}

