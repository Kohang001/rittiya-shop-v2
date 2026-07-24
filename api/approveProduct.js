// api/approveProduct.js
import { adminDb, verifyAdminRequest } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const admin = await verifyAdminRequest(req);
    if (!admin) {
        return res.status(403).json({ error: "ต้องเป็น admin เท่านั้น" });
    }

    const { shopId, productId, action, reason } = req.body;
    if (!shopId || !productId || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
    }

    try {
        const productRef = adminDb
            .collection("shops")
            .doc(shopId)
            .collection("products")
            .doc(productId);

        const productSnap = await productRef.get();
        if (!productSnap.exists) return res.status(404).json({ error: "ไม่พบสินค้า" });

        const newStatus = action === "approve" ? "approved" : "rejected";
        await productRef.update({
            status: newStatus,
            reviewedBy: admin.uid,
            reviewedAt: new Date(),
            rejectReason: action === "reject" ? reason || "" : null,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("approveProduct error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
}