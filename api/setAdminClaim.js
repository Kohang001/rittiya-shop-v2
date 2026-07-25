// api/setAdminClaim.js — อัปเดต Phase 9: เพิ่ม rate limit กันการยิงเดา secret ซ้ำๆ
import { adminAuth } from "./_firebaseAdmin.js";

const attemptLog = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 3; // ลองผิด secret ได้ไม่เกิน 3 ครั้ง/นาที/IP

function isRateLimited(ip) {
    const now = Date.now();
    const attempts = (attemptLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    attempts.push(now);
    attemptLog.set(ip, attempts);
    return attempts.length > MAX_ATTEMPTS;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: "ลองผิดถี่เกินไป กรุณารอสักครู่" });
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