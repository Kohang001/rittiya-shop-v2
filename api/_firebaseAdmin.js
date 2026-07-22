// api/_firebaseAdmin.js
// หมายเหตุ: ตัด import ของ firebase-admin/auth ออก เพราะทำให้เกิด ERR_REQUIRE_ESM
// crash บน Vercel (jose/jwks-rsa ที่ auth module ดึงเข้ามามีปัญหาเรื่อง ESM/CommonJS ชนกัน)
// ตอนนี้ยังไม่มีฟังก์ชันไหนใช้ adminAuth เลย จะกลับมาเพิ่มใหม่ตอน Phase 8
// (ตั้ง custom claim) ด้วยวิธีที่ปลอดภัยกว่านี้

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
    if (getApps().length) return getApps()[0];

    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

const app = getAdminApp();
export const adminDb = getFirestore(app);