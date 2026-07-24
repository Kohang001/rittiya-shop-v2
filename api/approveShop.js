// api/approveShop.js
import { adminDb, verifyAdminRequest } from "./_firebaseAdmin.js";
import { pushMessage } from "./_line.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const admin = await verifyAdminRequest(req);
    if (!admin) {
        return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });
    }

    const { shopId, action, reason } = req.body; // action: "approve" | "reject"
    if (!shopId || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
    }

    try {
        const shopRef = adminDb.collection("shops").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) return res.status(404).json({ error: "ไม่พบร้านค้า" });
        const shop = shopSnap.data();

        const newStatus = action === "approve" ? "approved" : "rejected";
        await shopRef.update({
            status: newStatus,
            reviewedBy: admin.uid,
            reviewedAt: new Date(),
            rejectReason: action === "reject" ? reason || "" : null,
        });

        if (shop.lineUserId) {
            const text =
                action === "approve"
                    ? `🎉 ร้าน "${shop.name}" ได้รับการอนุมัติแล้ว! เริ่มขายได้เลย`
                    : `❌ ร้าน "${shop.name}" ไม่ได้รับการอนุมัติ\nเหตุผล: ${reason || "ไม่ระบุ"}`;
            await pushMessage(shop.lineUserId, [{ type: "text", text }]);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("approveShop error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
}