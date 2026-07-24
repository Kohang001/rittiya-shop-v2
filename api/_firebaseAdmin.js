// api/_firebaseAdmin.js
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

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
export const adminAuth = getAuth(app);

/**
 * เช็คว่า request นี้มาจาก admin จริงไหม โดยตรวจ ID token จาก header Authorization
 * ใช้ในทุก endpoint ที่ต้องจำกัดสิทธิ์เฉพาะ admin (approveShop, approveProduct, setAdminClaim)
 * @returns {Promise<{uid: string} | null>} คืนค่า uid ถ้าเป็น admin จริง, null ถ้าไม่ใช่
 */
export async function verifyAdminRequest(req) {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace("Bearer ", "");
    if (!idToken) return null;

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (decoded.admin === true) {
            return { uid: decoded.uid };
        }
        return null;
    } catch (err) {
        console.error("verifyAdminRequest error:", err);
        return null;
    }
}