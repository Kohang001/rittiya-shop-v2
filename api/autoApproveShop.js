// api/autoApproveShop.js
import { adminDb } from "./_firebaseAdmin.js";

/**
 * API สำหรับตรวจสอบและอนุมัติร้านค้า + สินค้าโดยอัตโนมัติ (Automated Approval)
 * ทำงานร่วมกับระบบ Content Filter เพื่ออนุมัติทันทีที่เนื้อหาถูกต้อง
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { shopId } = req.body;
    if (!shopId) {
        return res.status(400).json({ error: "shopId is required" });
    }

    try {
        const shopRef = adminDb.collection("shops").doc(shopId);
        const shopSnap = await shopRef.get();

        if (!shopSnap.exists) {
            return res.status(404).json({ error: "ไม่พบร้านค้า" });
        }

        // อัปเดตสถานะร้านค้าเป็น approved
        await shopRef.update({
            status: "approved",
            reviewedBy: "auto-content-filter",
            reviewedAt: new Date(),
            rejectReason: null,
        });

        // อัปเดตสินค้าทั้งหมดของร้านที่เป็น pending ให้เป็น approved
        const productsSnap = await shopRef.collection("products").where("status", "==", "pending").get();
        const batch = adminDb.batch();

        productsSnap.forEach((doc) => {
            batch.update(doc.ref, {
                status: "approved",
                reviewedBy: "auto-content-filter",
                reviewedAt: new Date(),
                rejectReason: null,
            });
        });

        if (!productsSnap.empty) {
            await batch.commit();
        }

        return res.status(200).json({
            success: true,
            status: "approved",
            approvedProductsCount: productsSnap.size,
        });
    } catch (err) {
        console.error("autoApproveShop error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอนุมัติอัตโนมัติ" });
    }
}

