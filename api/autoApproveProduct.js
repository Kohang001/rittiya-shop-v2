// api/autoApproveProduct.js
import { adminDb } from "./_firebaseAdmin.js";

/**
 * API สำหรับตรวจสอบและอนุมัติสินค้าโดยอัตโนมัติ (Automated Approval)
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { shopId, productId } = req.body;
    if (!shopId || !productId) {
        return res.status(400).json({ error: "shopId and productId are required" });
    }

    try {
        const productRef = adminDb
            .collection("shops")
            .doc(shopId)
            .collection("products")
            .doc(productId);

        const prodSnap = await productRef.get();
        if (!prodSnap.exists) {
            return res.status(404).json({ error: "ไม่พบสินค้า" });
        }

        await productRef.update({
            status: "approved",
            reviewedBy: "auto-content-filter",
            reviewedAt: new Date(),
            rejectReason: null,
        });

        return res.status(200).json({ success: true, status: "approved" });
    } catch (err) {
        console.error("autoApproveProduct error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอนุมัติสินค้า" });
    }
}

