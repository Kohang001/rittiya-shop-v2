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

const MASTER_ADMIN_EMAIL = "nathwrrthsumphlxy@gmail.com";

/**
 * เช็คว่า request นี้มาจาก admin จริงไหม โดยตรวจ ID token และเอกสาร admins/{uid} ใน Firestore แบบ Real-Time
 * @returns {Promise<{uid: string, email: string, role: string} | null>}
 */
export async function verifyAdminRequest(req) {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace("Bearer ", "");
    if (!idToken) return null;

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const isMaster = decoded.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
        if (isMaster) {
            return { uid: decoded.uid, email: decoded.email, role: "super" };
        }

        // Single Source of Truth: ตรวจสอบเอกสารใน Firestore admins/{uid} เพื่อรองรับการปลดสิทธิ์ทันที
        const adminDoc = await adminDb.collection("admins").doc(decoded.uid).get();
        if (adminDoc.exists) {
            const data = adminDoc.data();
            if (data.role === "super" || data.role === "normal") {
                return { uid: decoded.uid, email: decoded.email, role: data.role };
            }
        }
        return null;
    } catch (err) {
        console.error("verifyAdminRequest error:", err);
        return null;
    }
}

/**
 * เช็คว่า request นี้มาจาก Super Admin จริงไหม โดยตรวจแบบ Real-Time จาก Firestore
 * @returns {Promise<import("firebase-admin/auth").DecodedIdToken | null>}
 */
export async function verifySuperAdminRequest(req) {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace("Bearer ", "");
    if (!idToken) return null;

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const isMaster = decoded.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
        if (isMaster) {
            return decoded;
        }

        // Single Source of Truth: ต้องมีเอกสารใน admins/{uid} และ role เป็น super เท่านั้น
        const adminDoc = await adminDb.collection("admins").doc(decoded.uid).get();
        if (adminDoc.exists && adminDoc.data().role === "super") {
            return decoded;
        }
        return null;
    } catch (err) {
        console.error("verifySuperAdminRequest error:", err);
        return null;
    }
}
