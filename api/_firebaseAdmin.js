// api/_firebaseAdmin.js
// ไฟล์นี้ไม่ใช่ endpoint (ขึ้นต้นด้วย _ เพื่อบอก Vercel ว่าไม่ใช่ route)
// เป็น helper ให้ทุก function ใน /api ใช้ Firebase Admin SDK ร่วมกัน

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
    if (getApps().length) return getApps()[0];

    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // ค่า private key ใน env var มักมี \n เป็น string ตรงๆ ต้องแปลงกลับเป็น newline จริง
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

const app = getAdminApp();
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);