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
 * @returns {Promise<{uid: string, email: string, role: string} | null>}
 */
export async function verifyAdminRequest(req) {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace("Bearer ", "");
    if (!idToken) return null;

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (decoded.admin === true) {
            return { uid: decoded.uid, email: decoded.email, role: decoded.adminRole || "super" };
        }
        return null;
    } catch (err) {
        console.error("verifyAdminRequest error:", err);
        return null;
    }
}

/**
 * เช็คว่า request นี้มาจาก Super Admin จริงไหม
 * บัญชีที่มี claim admin: true แต่ไม่มี adminRole จะถือเป็น super โดยปริยาย (Backward Compatible)
 * @returns {Promise<import("firebase-admin/auth").DecodedIdToken | null>}
 */
export async function verifySuperAdminRequest(req) {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace("Bearer ", "");
    if (!idToken) return null;

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const isSuper = decoded.admin === true && (decoded.adminRole === "super" || !decoded.adminRole);
        if (isSuper) {
            return decoded;
        }
        return null;
    } catch (err) {
        console.error("verifySuperAdminRequest error:", err);
        return null;
    }
}
