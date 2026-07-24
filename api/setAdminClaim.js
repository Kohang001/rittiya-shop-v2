// api/setAdminClaim.js
// ใช้ตั้งให้บัญชีใดบัญชีหนึ่งเป็น admin — ป้องกันด้วย secret key ลับ (ไม่ใช่ custom claim
// เพราะตอน admin คนแรกยังไม่มีใครมี claim เลย ต้องมีทางเข้าครั้งแรกที่ไม่ต้องพึ่ง claim)
import { adminAuth } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { uid, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SETUP_SECRET) {
        return res.status(403).json({ error: "secret key ไม่ถูกต้อง" });
    }
    if (!uid) {
        return res.status(400).json({ error: "missing uid" });
    }

    try {
        await adminAuth.setCustomUserClaims(uid, { admin: true });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("setAdminClaim error:", err);
        return res.status(500).json({ error: "ตั้งค่าไม่สำเร็จ" });
    }
}