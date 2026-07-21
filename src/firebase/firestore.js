// src/firebase/firestore.js
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/* ---------------------------------------------
 * SHOPS
 * ------------------------------------------- */

/** ดึงร้านค้าที่อนุมัติแล้วทั้งหมด (สำหรับหน้า public เช่น Home) */
export async function getApprovedShops() {
    const q = query(
        collection(db, "shops"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** ดึงร้านตาม id เดียว (ใช้ทั้งหน้า public detail และ dashboard เจ้าของร้าน) */
export async function getShopById(shopId) {
    const ref = doc(db, "shops", shopId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
}

/** ดึงร้านทั้งหมดของเจ้าของคนนี้ (ปกติจะมีร้านเดียว แต่เผื่อไว้) */
export async function getShopsByOwner(ownerUid) {
    const q = query(collection(db, "shops"), where("ownerUid", "==", ownerUid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** ดึงร้านทั้งหมดสำหรับ Admin (ทุกสถานะ กรองทีหลังฝั่ง UI ได้) */
export async function getAllShopsForAdmin() {
    const q = query(collection(db, "shops"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * สร้างร้านใหม่ (สถานะ pending เสมอ ตาม Security Rules)
 * @param {object} shopData - { ownerUid, name, slogan, logoUrl, phone, ig, category }
 * @returns {Promise<{id: string, lineLinkCode: string}>}
 */
export async function createShopDraft(shopData) {
    const lineLinkCode = generateLineLinkCode();
    const docRef = await addDoc(collection(db, "shops"), {
        ...shopData,
        status: "pending",
        lineUserId: null,
        lineLinkCode,
        createdAt: serverTimestamp(),
    });
    return { id: docRef.id, lineLinkCode };
}

/** แก้ไขข้อมูลร้าน (ห้ามแก้ status — Security Rules จะบล็อกอยู่แล้วเป็นชั้นป้องกันซ้อน) */
export async function updateShopInfo(shopId, updates) {
    const { status, ownerUid, ...safeUpdates } = updates; // กันพลาดไม่ให้ส่ง status/ownerUid ติดไปด้วย
    await updateDoc(doc(db, "shops", shopId), safeUpdates);
}

function generateLineLinkCode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // รหัส 6 หลัก
}

/* ---------------------------------------------
 * PRODUCTS (subcollection ของ shops)
 * ------------------------------------------- */

/** ดึงสินค้าที่อนุมัติแล้วของร้าน (สำหรับหน้า public ShopDetailPage) */
export async function getApprovedProducts(shopId) {
    const q = query(
        collection(db, "shops", shopId, "products"),
        where("status", "==", "approved")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** ดึงสินค้าทั้งหมดของร้าน (ทุกสถานะ — ใช้ใน Seller Dashboard / Admin) */
export async function getAllProducts(shopId) {
    const snapshot = await getDocs(collection(db, "shops", shopId, "products"));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** เพิ่มสินค้าใหม่ (สถานะ pending เสมอ) */
export async function addProduct(shopId, productData) {
    const docRef = await addDoc(collection(db, "shops", shopId, "products"), {
        ...productData,
        status: "pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/** แก้ไขสินค้า (ราคา/รายละเอียด/รูป) */
export async function updateProduct(shopId, productId, updates) {
    const { status, ...safeUpdates } = updates;
    await updateDoc(doc(db, "shops", shopId, "products", productId), safeUpdates);
}

/** ลบสินค้า */
export async function deleteProduct(shopId, productId) {
    await deleteDoc(doc(db, "shops", shopId, "products", productId));
}

/* ---------------------------------------------
 * ORDERS (subcollection ของ shops, อ่านอย่างเดียวฝั่ง client)
 * ------------------------------------------- */

/** ดึงออเดอร์ทั้งหมดของร้าน (เฉพาะเจ้าของร้าน/admin อ่านได้ตาม Security Rules) */
export async function getOrdersByShop(shopId) {
    const q = query(
        collection(db, "shops", shopId, "orders"),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------------------------------------
 * FEED POSTS
 * ------------------------------------------- */

/** ดึงประกาศที่อนุมัติแล้วทั้งหมด (สำหรับหน้า Feed สาธารณะ) */
export async function getApprovedFeedPosts() {
    const q = query(
        collection(db, "feedPosts"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** สร้างประกาศใหม่ (สถานะ pending เสมอ) */
export async function createFeedPost(postData) {
    const docRef = await addDoc(collection(db, "feedPosts"), {
        ...postData,
        status: "pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/** ดึงประกาศทั้งหมดของร้านตัวเอง (ทุกสถานะ — ใช้ใน Seller Dashboard) */
export async function getFeedPostsByShop(shopId) {
    const q = query(collection(db, "feedPosts"), where("shopId", "==", shopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}