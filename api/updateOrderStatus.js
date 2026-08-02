// api/updateOrderStatus.js — Security Round 2: บังคับ state machine ห้ามข้ามขั้น
import { adminDb, adminAuth } from "./_firebaseAdmin.js";

// กำหนดว่าจากสถานะไหน ไปสถานะไหนได้บ้าง — ห้ามข้ามขั้นหรือย้อนกลับจากสถานะจบแล้ว
const ALLOWED_TRANSITIONS = {
    pending: ["cancelled"], // ออเดอร์เก่าที่ยังไม่มีสลิป (แทบไม่เกิดแล้วในเวอร์ชันปัจจุบัน แต่กันไว้เผื่อข้อมูลเก่า)
    slip_uploaded: ["preparing", "cancelled"],
    preparing: ["completed", "cancelled"],
    completed: [], // สถานะจบแล้ว เปลี่ยนต่อไม่ได้
    cancelled: [], // สถานะจบแล้ว เปลี่ยนต่อไม่ได้
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { shopId, orderId, status: newStatus } = req.body;
    if (!shopId || !orderId || !newStatus) {
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

        const orderRef = shopRef.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) return res.status(404).json({ error: "ไม่พบออเดอร์นี้" });

        const currentStatus = orderSnap.data().status || "pending";
        const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

        // admin ยกเว้นให้ข้ามขั้นได้ในกรณีฉุกเฉิน (เช่นแก้ข้อมูลผิดพลาด) แต่ seller ต้องเดินตามลำดับเท่านั้น
        if (!isAdmin && !allowedNext.includes(newStatus)) {
            return res.status(409).json({
                error: `ไม่สามารถเปลี่ยนจากสถานะ "${currentStatus}" ไปเป็น "${newStatus}" ได้โดยตรง`,
            });
        }
        if (!Object.keys(ALLOWED_TRANSITIONS).includes(newStatus)) {
            return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
        }

        await orderRef.update({
            status: newStatus,
            updatedAt: new Date(),
            updatedBy: decoded.uid,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("updateOrderStatus error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
}