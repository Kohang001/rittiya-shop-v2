// src/firebase/firestore.js
import {
    collection,
    collectionGroup,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./config";

/* ---------------------------------------------
 * SHOPS
 * ------------------------------------------- */

/**
 * ดึงร้านค้าทั้งหมดที่ผ่านการคัดกรองเนื้อหา (อนุมัติแล้ว หรือผ่านการคัดกรองอัตโนมัติ)
 */
export async function getApprovedShops() {
    const q = query(
        collection(db, "shops"),
        where("status", "in", ["approved", "pending"]),
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
    const dataToSave = {
        ownerUid: shopData.ownerUid || "",
        name: shopData.name || "",
        slogan: shopData.slogan || "",
        logoUrl: shopData.logoUrl || "",
        phone: shopData.phone || "",
        promptpayId: shopData.promptpayId || "",
        bankName: shopData.bankName || "",
        bankAccountNumber: shopData.bankAccountNumber || "",
        bankAccountName: shopData.bankAccountName || "",
        ig: shopData.ig || "",
        category: shopData.category || "",
        isOpen: true,
        lineUserId: null,
        lineLinkCode,
        createdAt: serverTimestamp(),
    };

    let docRef;
    try {
        // ลองสร้างเป็น approved ทันที
        docRef = await addDoc(collection(db, "shops"), {
            ...dataToSave,
            status: "approved",
        });
    } catch (err) {
        // หาก rules ใน Firebase Console ยังคงระบุให้ create ด้วย status == 'pending'
        if (err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions")) {
            docRef = await addDoc(collection(db, "shops"), {
                ...dataToSave,
                status: "pending",
            });
            fetch("/api/autoApproveShop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId: docRef.id }),
            }).catch(() => {});
        } else {
            throw err;
        }
    }

    return { id: docRef.id, lineLinkCode };
}

export async function updateShopInfo(shopId, updates) {
    const { ownerUid: _ownerUid, ...safeUpdates } = updates;
    await updateDoc(doc(db, "shops", shopId), safeUpdates);
}

/** เปิด/ปิดร้านชั่วคราว (เช่นช่วงสอบ) — ไม่กระทบ status การอนุมัติ */
export async function setShopOpenStatus(shopId, isOpen) {
    await updateDoc(doc(db, "shops", shopId), {
        isOpen,
        updatedAt: serverTimestamp(),
    });
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
        where("status", "in", ["approved", "pending"])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllProducts(shopId) {
    const snapshot = await getDocs(collection(db, "shops", shopId, "products"));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addProduct(shopId, productData) {
    const dataToSave = {
        name: productData.name || "",
        desc: productData.desc || "",
        price: Number(productData.price) || 0,
        imageUrl: productData.imageUrl || "",
        isAvailable: productData.isAvailable !== false,
        createdAt: serverTimestamp(),
    };

    let docRef;
    try {
        docRef = await addDoc(collection(db, "shops", shopId, "products"), {
            ...dataToSave,
            status: "approved",
        });
    } catch (err) {
        if (err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions")) {
            docRef = await addDoc(collection(db, "shops", shopId, "products"), {
                ...dataToSave,
                status: "pending",
            });
            fetch("/api/autoApproveProduct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId, productId: docRef.id }),
            }).catch(() => {});
        } else {
            throw err;
        }
    }

    return docRef.id;
}

export async function updateProduct(shopId, productId, updates) {
    const dataToSave = {
        ...updates,
        ...(updates.price !== undefined ? { price: Number(updates.price) || 0 } : {}),
    };

    try {
        await updateDoc(doc(db, "shops", shopId, "products", productId), {
            ...dataToSave,
            status: "approved",
        });
    } catch (err) {
        if (err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions")) {
            await updateDoc(doc(db, "shops", shopId, "products", productId), {
                ...dataToSave,
                status: "pending",
            });
            fetch("/api/autoApproveProduct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId, productId }),
            }).catch(() => {});
        } else {
            throw err;
        }
    }
}

export async function deleteProduct(shopId, productId) {
    await deleteDoc(doc(db, "shops", shopId, "products", productId));
}

/**
 * แม่ค้าปรับสถานะสินค้า: พร้อมขาย / สินค้าหมด (In-Stock / Out-of-Stock)
 */
export async function setProductAvailability(shopId, productId, isAvailable) {
    await updateDoc(doc(db, "shops", shopId, "products", productId), {
        isAvailable: Boolean(isAvailable),
    });
}

/**
 * ใช้ในหน้า Admin — สินค้าที่ยัง pending อยู่ ข้ามทุกร้านพร้อมกัน (collectionGroup query)
 */
export async function getAllPendingProductsGlobal() {
    const q = query(collectionGroup(db, "products"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        shopId: d.ref.parent.parent.id,
        ...d.data(),
    }));
}

/**
 * ใช้ในหน้า Admin — ดึงแคตตาล็อกสินค้าทั้งหมดข้ามทุกร้าน
 * มีระบบ Graceful Fallback หาก collectionGroup ติด Permission หรือ Index ใน Firestore
 */
export async function getAllProductsForAdmin() {
    try {
        const q = query(
            collectionGroup(db, "products"),
            where("status", "in", ["approved", "pending"])
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            shopId: d.ref.parent.parent.id,
            ...d.data(),
        }));
    } catch {
        // Fallback: ดึงสินค้าของแต่ละร้านมารวมกันโดยตรง (ไม่ติดข้อจำกัด collectionGroup)
        try {
            const shops = await getAllShopsForAdmin();
            const productLists = await Promise.all(
                shops.map(async (shop) => {
                    try {
                        const prods = await getAllProducts(shop.id);
                        return prods.map((p) => ({
                            ...p,
                            shopId: shop.id,
                            shopName: shop.name,
                        }));
                    } catch {
                        return [];
                    }
                })
            );
            return productLists.flat();
        } catch {
            return [];
        }
    }
}

/**
 * ผู้ดูแลระบบใช้ระงับร้านค้าชั่วคราว (กรณีตรวจพบการละเมิดกฎ)
 * บันทึก Audit Log กิจกรรมของ Admin อัตโนมัติ
 */
export async function suspendShop(shopId, reason, actorInfo = {}) {
    const shopName = actorInfo.shopName || "";
    try {
        await updateDoc(doc(db, "shops", shopId), {
            status: "rejected",
            rejectReason: reason || "ระงับการให้บริการโดยผู้ดูแลระบบ",
            isOpen: false,
        });

        await logAdminAction({
            action: "suspend_shop",
            targetType: "shop",
            targetId: shopId,
            targetName: shopName,
            detail: `ระงับร้านค้า${shopName ? ` '${shopName}'` : ""} เหตุผล: ${reason || "ระงับการให้บริการโดยผู้ดูแลระบบ"}`,
            status: "warning",
            metadata: { reason, shopId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
    } catch (err) {
        await logAdminAction({
            action: "suspend_shop",
            targetType: "shop",
            targetId: shopId,
            targetName: shopName,
            detail: `เกิดข้อผิดพลาดในการระงับร้านค้า: ${err.message}`,
            status: "error",
            errorDetails: err.message,
            metadata: { reason, shopId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
        throw err;
    }
}

/**
 * ผู้ดูแลระบบยกเลิกการระงับร้านค้า — กลับมาเปิดให้บริการตามปกติ
 * บันทึก Audit Log กิจกรรมของ Admin อัตโนมัติ
 */
export async function activateShop(shopId, actorInfo = {}) {
    const shopName = actorInfo.shopName || "";
    try {
        await updateDoc(doc(db, "shops", shopId), {
            status: "approved",
            rejectReason: null,
            isOpen: true,
        });

        await logAdminAction({
            action: "activate_shop",
            targetType: "shop",
            targetId: shopId,
            targetName: shopName,
            detail: `ยกเลิกการระงับและเปิดร้านค้า${shopName ? ` '${shopName}'` : ""} กลับมาให้บริการตามปกติ`,
            status: "success",
            metadata: { shopId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
    } catch (err) {
        await logAdminAction({
            action: "activate_shop",
            targetType: "shop",
            targetId: shopId,
            targetName: shopName,
            detail: `เกิดข้อผิดพลาดในการยกเลิกการระงับร้านค้า: ${err.message}`,
            status: "error",
            errorDetails: err.message,
            metadata: { shopId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
        throw err;
    }
}

/**
 * ผู้ดูแลระบบซ่อนสินค้าที่ไม่เหมาะสมออกจากแคตตาล็อก
 * บันทึก Audit Log กิจกรรมของ Admin อัตโนมัติ
 */
export async function hideProductByAdmin(shopId, productId, reason, actorInfo = {}) {
    const productName = actorInfo.productName || "";
    try {
        await updateDoc(doc(db, "shops", shopId, "products", productId), {
            status: "rejected",
            rejectReason: reason || "ซ่อนโดยผู้ดูแลระบบ",
        });

        await logAdminAction({
            action: "hide_product",
            targetType: "product",
            targetId: productId,
            targetName: productName,
            detail: `ซ่อนสินค้า${productName ? ` '${productName}'` : ""} ออกจากแคตตาล็อก เหตุผล: ${reason || "ซ่อนโดยผู้ดูแลระบบ"}`,
            status: "warning",
            metadata: { reason, shopId, productId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
    } catch (err) {
        await logAdminAction({
            action: "hide_product",
            targetType: "product",
            targetId: productId,
            targetName: productName,
            detail: `เกิดข้อผิดพลาดในการซ่อนสินค้า: ${err.message}`,
            status: "error",
            errorDetails: err.message,
            metadata: { reason, shopId, productId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
        throw err;
    }
}

/**
 * ผู้ดูแลระบบปลดซ่อนสินค้า — กลับมาแสดงในแคตตาล็อกตามปกติ
 * บันทึก Audit Log กิจกรรมของ Admin อัตโนมัติ
 */
export async function unhideProductByAdmin(shopId, productId, actorInfo = {}) {
    const productName = actorInfo.productName || "";
    try {
        await updateDoc(doc(db, "shops", shopId, "products", productId), {
            status: "approved",
            rejectReason: null,
        });

        await logAdminAction({
            action: "unhide_product",
            targetType: "product",
            targetId: productId,
            targetName: productName,
            detail: `ปลดซ่อนสินค้า${productName ? ` '${productName}'` : ""} กลับสู่แคตตาล็อกตามปกติ`,
            status: "success",
            metadata: { shopId, productId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
    } catch (err) {
        await logAdminAction({
            action: "unhide_product",
            targetType: "product",
            targetId: productId,
            targetName: productName,
            detail: `เกิดข้อผิดพลาดในการปลดซ่อนสินค้า: ${err.message}`,
            status: "error",
            errorDetails: err.message,
            metadata: { shopId, productId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
        throw err;
    }
}

/**
 * ใช้ในหน้าค้นหาสินค้าข้ามทุกร้าน — ดึงสินค้า approved ทั้งหมดมาก่อน
 * มีระบบ Graceful Fallback หาก collectionGroup ติด Permission หรือ Index ใน Firestore
 */
export async function getAllApprovedProductsGlobal() {
    try {
        const q = query(
            collectionGroup(db, "products"),
            where("status", "in", ["approved", "pending"])
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            shopId: d.ref.parent.parent.id,
            ...d.data(),
        }));
    } catch {
        // Fallback: ดึงสินค้าของร้านค้าที่เปิดอยู่มารวมกันโดยตรง
        try {
            const shops = await getApprovedShops();
            const productLists = await Promise.all(
                shops.map(async (shop) => {
                    try {
                        const prods = await getApprovedProducts(shop.id);
                        return prods.map((p) => ({
                            ...p,
                            shopId: shop.id,
                            shopName: shop.name,
                        }));
                    } catch {
                        return [];
                    }
                })
            );
            return productLists.flat();
        } catch {
            return [];
        }
    }
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
 * ใช้ในหน้า Admin — ออเดอร์ทั้งหมดข้ามทุกร้าน
 * มีระบบ Graceful Fallback หาก collectionGroup ติด Permission หรือ Index ใน Firestore
 */
export async function getAllOrdersForAdmin() {
    try {
        const q = query(collectionGroup(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            shopId: d.ref.parent.parent.id,
            ...d.data(),
        }));
    } catch {
        // Fallback: ดึงออเดอร์ของแต่ละร้านมารวมกันโดยตรง
        try {
            const shops = await getAllShopsForAdmin();
            const orderLists = await Promise.all(
                shops.map(async (shop) => {
                    try {
                        const ords = await getOrdersByShop(shop.id);
                        return ords.map((o) => ({
                            ...o,
                            shopId: shop.id,
                        }));
                    } catch {
                        return [];
                    }
                })
            );
            return orderLists.flat().sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return timeB - timeA;
            });
        } catch {
            return [];
        }
    }
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
    const cleanData = {
        title: (postData.title || "").trim().slice(0, 200),
        content: (postData.content || "").trim().slice(0, 5000),
        status: "approved",
        createdAt: serverTimestamp(),
    };
    if (postData.shopId) cleanData.shopId = postData.shopId;
    if (postData.shopName) cleanData.shopName = String(postData.shopName).trim().slice(0, 100);
    if (postData.shopLogoUrl) cleanData.shopLogoUrl = String(postData.shopLogoUrl).trim().slice(0, 1000);
    if (postData.imageUrl) cleanData.imageUrl = String(postData.imageUrl).trim().slice(0, 1000);
    if (postData.authorRole) cleanData.authorRole = postData.authorRole;
    if (postData.authorEmail) cleanData.authorEmail = postData.authorEmail;

    const docRef = await addDoc(collection(db, "feedPosts"), cleanData);
    return docRef.id;
}

export async function getFeedPostsByShop(shopId) {
    const q = query(collection(db, "feedPosts"), where("shopId", "==", shopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllFeedPostsForAdmin() {
    const q = query(collection(db, "feedPosts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function hideFeedPost(postId, actorInfo = {}) {
    const postTitle = actorInfo.postTitle || "";
    try {
        await updateDoc(doc(db, "feedPosts", postId), { status: "rejected" });
        await logAdminAction({
            action: "hide_feed_post",
            targetType: "feedPost",
            targetId: postId,
            targetName: postTitle,
            detail: `ซ่อนประกาศข่าวสาร${postTitle ? ` '${postTitle}'` : ""} ออกจากหน้า Feed`,
            status: "warning",
            metadata: { postId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
    } catch (err) {
        await logAdminAction({
            action: "hide_feed_post",
            targetType: "feedPost",
            targetId: postId,
            targetName: postTitle,
            detail: `เกิดข้อผิดพลาดในการซ่อนประกาศข่าวสาร: ${err.message}`,
            status: "error",
            errorDetails: err.message,
            metadata: { postId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
        throw err;
    }
}

export async function unhideFeedPost(postId, actorInfo = {}) {
    const postTitle = actorInfo.postTitle || "";
    try {
        await updateDoc(doc(db, "feedPosts", postId), { status: "approved" });
        await logAdminAction({
            action: "unhide_feed_post",
            targetType: "feedPost",
            targetId: postId,
            targetName: postTitle,
            detail: `ปลดซ่อนประกาศข่าวสาร${postTitle ? ` '${postTitle}'` : ""} กลับสู่หน้า Feed ตามปกติ`,
            status: "success",
            metadata: { postId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
    } catch (err) {
        await logAdminAction({
            action: "unhide_feed_post",
            targetType: "feedPost",
            targetId: postId,
            targetName: postTitle,
            detail: `เกิดข้อผิดพลาดในการปลดซ่อนประกาศข่าวสาร: ${err.message}`,
            status: "error",
            errorDetails: err.message,
            metadata: { postId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
        throw err;
    }
}

export async function deleteFeedPost(postId, actorInfo = {}) {
    const postTitle = actorInfo.postTitle || "";
    try {
        await deleteDoc(doc(db, "feedPosts", postId));
        await logAdminAction({
            action: "delete_feed_post",
            targetType: "feedPost",
            targetId: postId,
            targetName: postTitle,
            detail: `ลบประกาศข่าวสาร${postTitle ? ` '${postTitle}'` : ""}`,
            status: "warning",
            metadata: { postId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
    } catch (err) {
        await logAdminAction({
            action: "delete_feed_post",
            targetType: "feedPost",
            targetId: postId,
            targetName: postTitle,
            detail: `เกิดข้อผิดพลาดในการลบประกาศข่าวสาร: ${err.message}`,
            status: "error",
            errorDetails: err.message,
            metadata: { postId },
            actorEmail: actorInfo.actorEmail,
            actorUid: actorInfo.actorUid,
        });
        throw err;
    }
}

/* ---------------------------------------------
 * ADMIN AUDIT LOGS (กิจกรรมและข้อผิดพลาดของผู้ดูแลระบบ)
 * ------------------------------------------- */

/**
 * บันทึกกิจกรรมและการดำเนินการของ Admin (Audit Trail) เพื่อความโปร่งใสและตรวจสอบข้อผิดพลาดย้อนหลัง
 * @param {Object} params
 * @param {string} params.action - เช่น 'suspend_shop', 'activate_shop', 'hide_product', 'unhide_product', 'admin_login', 'admin_error'
 * @param {string} [params.targetType] - 'shop', 'product', 'feedPost', 'auth', 'system'
 * @param {string} [params.targetId] - รหัสเป้าหมาย
 * @param {string} [params.targetName] - ชื่อเป้าหมาย (เช่น ชื่อร้าน, ชื่อสินค้า)
 * @param {string} params.detail - รายละเอียดกิจกรรม
 * @param {"success"|"warning"|"error"} [params.status="success"]
 * @param {string} [params.errorDetails] - รายละเอียดข้อผิดพลาด / stack trace (กรณีเกิดข้อผิดพลาด)
 * @param {Object} [params.metadata] - ข้อมูลเพิ่มเติม
 * @param {string} [params.actorEmail] - อีเมล Admin ผู้กระทำ
 * @param {string} [params.actorUid] - UID Admin ผู้กระทำ
 */
export async function logAdminAction(params) {
    try {
        const currentUser = auth.currentUser;
        const logData = {
            action: params.action || "unknown",
            targetType: params.targetType || "system",
            targetId: params.targetId || "",
            targetName: params.targetName || "",
            detail: params.detail || "",
            status: params.status || "success",
            errorDetails: params.errorDetails || null,
            metadata: params.metadata || {},
            actorEmail: params.actorEmail || currentUser?.email || "Admin",
            actorUid: params.actorUid || currentUser?.uid || "admin",
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "adminLogs"), logData);
        return docRef.id;
    } catch (err) {
        // บันทึก log ล้มเหลวจะไม่ขัดขวางการทำงานหลักของระบบ แต่พิมพ์เตือนไว้เพื่อตรวจสอบ
        console.warn("Failed to write admin log:", err);
        return null;
    }
}

/**
 * ดึงประวัติกิจกรรมและ Audit Logs ของ Admin ล่าสุด
 * @param {number} [limitCount=50]
 */
export async function getAdminLogs(limitCount = 50) {
    try {
        const q = query(
            collection(db, "adminLogs"),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
    } catch (err) {
        console.warn("Failed to get admin logs (collection may not exist yet or permissions pending):", err);
        return [];
    }
}

/**
 * บันทึกหรืออัปเดตรหัสผูก LINE ของ Admin ลงใน Firestore คอลเลกชัน admins โดยตรง
 */
export async function saveAdminLinePairingCode(uid, email, role, lineLinkCode) {
    try {
        const adminRef = doc(db, "admins", uid);
        await setDoc(
            adminRef,
            {
                uid,
                email,
                role: role || "super",
                lineLinkCode,
                lineUserId: null,
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );
        return true;
    } catch (err) {
        console.warn("saveAdminLinePairingCode error:", err);
        return false;
    }
}

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้ทั่วไป (ชื่อ, เบอร์ติดต่อ, สถานที่นัดรับประจำ)
 */
export async function getUserProfile(uid) {
    if (!uid) return null;
    try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        return null;
    } catch (err) {
        console.warn("getUserProfile error:", err);
        return null;
    }
}

/**
 * บันทึกหรืออัปเดตข้อมูลโปรไฟล์ผู้ใช้ทั่วไป
 */
export async function saveUserProfile(uid, data) {
    if (!uid) return false;
    try {
        const ref = doc(db, "users", uid);
        await setDoc(
            ref,
            {
                uid,
                ...data,
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );
        return true;
    } catch (err) {
        console.error("saveUserProfile error:", err);
        throw err;
    }
}

/**
 * ดึงข้อมูลผู้ใช้ทั้งหมดสำหรับแอดมิน เพื่อนำมาประกอบเป็น Activity Stream
 */
export async function getAllUsersForAdmin(limitCount = 60) {
    try {
        const q = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
    } catch (err) {
        console.warn("Failed to get users for admin:", err);
        return [];
    }
}
