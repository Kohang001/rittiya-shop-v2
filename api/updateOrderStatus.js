// api/updateOrderStatus.js
import { adminDb, adminAuth } from "./_firebaseAdmin.js";

const ALLOWED_STATUSES = ["pending", "preparing", "completed", "cancelled"];

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { shopId, orderId, status } = req.body;
    if (!shopId || !orderId || !ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
    }

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace("Bearer ", "");
    if (!idToken) return res.status(401).json({ error: "ต้อง login ก่อน" });

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);

        const shopRef = adminDb.collection("shops").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) return res.status(404).json({ error: "ไม่พบร้านค้า" });

        const isOwner = shopSnap.data().ownerUid === decoded.uid;
        const isAdmin = decoded.admin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขออเดอร์นี้" });
        }

        await shopRef.collection("orders").doc(orderId).update({
            status,
            updatedAt: new Date(),
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("updateOrderStatus error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
}