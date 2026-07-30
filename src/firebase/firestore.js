// src/firebase/firestore.js
import {
    collection,
    collectionGroup,
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

export async function getApprovedShops() {
    const q = query(
        collection(db, "shops"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getShopById(shopId) {
    const ref = doc(db, "shops", shopId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
}

export async function getShopsByOwner(ownerUid) {
    const q = query(collection(db, "shops"), where("ownerUid", "==", ownerUid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllShopsForAdmin() {
    const q = query(collection(db, "shops"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createShopDraft(shopData) {
    const lineLinkCode = generateLineLinkCode();
    const docRef = await addDoc(collection(db, "shops"), {
        ...shopData,
        status: "pending",
        isOpen: true,
        lineUserId: null,
        lineLinkCode,
        createdAt: serverTimestamp(),
    });
    return { id: docRef.id, lineLinkCode };
}

export async function updateShopInfo(shopId, updates) {
    const { status, ownerUid, ...safeUpdates } = updates;
    await updateDoc(doc(db, "shops", shopId), safeUpdates);
}

/** เปิด/ปิดร้านชั่วคราว (เช่นช่วงสอบ) — ไม่กระทบ status การอนุมัติ */
export async function setShopOpenStatus(shopId, isOpen) {
    await updateDoc(doc(db, "shops", shopId), { isOpen });
}

function generateLineLinkCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ---------------------------------------------
 * PRODUCTS (subcollection ของ shops)
 * ------------------------------------------- */

export async function getApprovedProducts(shopId) {
    const q = query(
        collection(db, "shops", shopId, "products"),
        where("status", "==", "approved")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllProducts(shopId) {
    const snapshot = await getDocs(collection(db, "shops", shopId, "products"));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addProduct(shopId, productData) {
    const docRef = await addDoc(collection(db, "shops", shopId, "products"), {
        ...productData,
        status: "pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateProduct(shopId, productId, updates) {
    await updateDoc(doc(db, "shops", shopId, "products", productId), updates);
}

export async function deleteProduct(shopId, productId) {
    await deleteDoc(doc(db, "shops", shopId, "products", productId));
}

/**
 * ใช้ในหน้า Admin — สินค้าที่ยัง pending อยู่ ข้ามทุกร้านพร้อมกัน (collectionGroup query)
 * ต้องมี Firestore Index composite: collection group "products", field "status" Ascending
 * (ถ้าเจอ error ขอ index ตอนเรียกใช้ครั้งแรก คลิก link ใน error สร้างได้เลยเหมือน index อื่นๆ)
 */
export async function getAllPendingProductsGlobal() {
    const q = query(collectionGroup(db, "products"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        shopId: d.ref.parent.parent.id, // ดึง shopId จาก path ของ document แม่
        ...d.data(),
    }));
}

/**
 * ใช้ในหน้าค้นหาสินค้าข้ามทุกร้าน — ดึงสินค้า approved ทั้งหมดมาก่อน แล้วกรองชื่อฝั่ง client
 * (โปรเจกต์ขนาดนี้ยังไม่จำเป็นต้องใช้ full-text search service แยกต่างหาก)
 * ใช้วิธีดึงร้าน approved ก่อน แล้ว query สินค้าแต่ละร้าน — ไม่ต้องสร้าง collectionGroup index
 */
export async function getAllApprovedProductsGlobal() {
    // 1) ดึงร้านค้าที่ approved ทั้งหมด
    const shopsSnap = await getDocs(
        query(collection(db, "shops"), where("status", "==", "approved"))
    );
    const shopIds = shopsSnap.docs.map((d) => d.id);

    if (shopIds.length === 0) return [];

    // 2) ดึงสินค้า approved ของแต่ละร้านพร้อมกัน
    const results = await Promise.all(
        shopIds.map(async (shopId) => {
            const q2 = query(
                collection(db, "shops", shopId, "products"),
                where("status", "==", "approved")
            );
            const snap = await getDocs(q2);
            return snap.docs.map((d) => ({
                id: d.id,
                shopId,
                ...d.data(),
            }));
        })
    );

    // 3) รวม array ของทุกร้านเป็น array เดียว
    return results.flat();
}

export async function getOrdersByShop(shopId) {
    const q = query(
        collection(db, "shops", shopId, "orders"),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * ใช้ในหน้า Admin — ออเดอร์ทั้งหมดข้ามทุกร้าน (collectionGroup query)
 * ต้องมี Firestore Index composite: collection group "orders", field "createdAt" Descending
 */
export async function getAllOrdersForAdmin() {
    const q = query(collectionGroup(db, "orders"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        shopId: d.ref.parent.parent.id,
        ...d.data(),
    }));
}

/* ---------------------------------------------
 * FEED POSTS
 * ------------------------------------------- */

export async function getApprovedFeedPosts() {
    const q = query(
        collection(db, "feedPosts"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createFeedPost(postData) {
    const docRef = await addDoc(collection(db, "feedPosts"), {
        ...postData,
        status: "pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getFeedPostsByShop(shopId) {
    const q = query(collection(db, "feedPosts"), where("shopId", "==", shopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** ใช้ในหน้า Admin — ประกาศทั้งหมดทุกสถานะ */
export async function getAllFeedPostsForAdmin() {
    const q = query(collection(db, "feedPosts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}