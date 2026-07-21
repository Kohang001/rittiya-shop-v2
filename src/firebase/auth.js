// src/firebase/auth.js
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config";

/**
 * สมัครบัญชีใหม่ด้วยอีเมล + รหัสผ่าน
 * ใช้สำหรับทั้งแม่ค้า (seller) และแอดมิน — แยกสิทธิ์ด้วย custom claim ทีหลัง ไม่ใช่ตอนสมัคร
 */
export async function registerUser(email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error) {
        return { user: null, error: mapAuthError(error.code) };
    }
}

/**
 * ล็อกอินด้วยอีเมล + รหัสผ่าน
 */
export async function loginUser(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error) {
        return { user: null, error: mapAuthError(error.code) };
    }
}

/**
 * ออกจากระบบ
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error: "ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง" };
    }
}

/**
 * ฟังการเปลี่ยนแปลงสถานะล็อกอิน (ใช้ใน AuthContext)
 * @param {(user: import("firebase/auth").User | null) => void} callback
 * @returns unsubscribe function
 */
export function watchAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

/**
 * แปล error code ของ Firebase เป็นข้อความภาษาไทยที่เข้าใจง่าย
 */
function mapAuthError(code) {
    const messages = {
        "auth/email-already-in-use": "อีเมลนี้ถูกใช้สมัครไปแล้ว",
        "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
        "auth/weak-password": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        "auth/user-not-found": "ไม่พบบัญชีนี้ในระบบ",
        "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
        "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        "auth/too-many-requests": "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
    };
    return messages[code] || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}