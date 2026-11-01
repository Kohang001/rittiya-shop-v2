// api/manageAdminRoles.js — ดึงรายชื่อผู้ใช้ และจัดการระดับสิทธิ์ Admin (Super vs Normal)
import { adminDb, adminAuth, verifySuperAdminRequest } from "./_firebaseAdmin.js";

const MASTER_ADMIN_EMAIL = "nathwrrthsumphlxy@gmail.com";

export default async function handler(req, res) {
    const superAdmin = await verifySuperAdminRequest(req);
    if (!superAdmin) {
        return res.status(403).json({ error: "สงวนสิทธิ์เฉพาะ Super Admin เท่านั้น" });
    }

    if (req.method === "GET") {
        try {
            // 1. ดึงรายชื่อผู้ใช้ทั้งหมดจาก Firebase Auth (100 ผู้ใช้ล่าสุด)
            const listUsersResult = await adminAuth.listUsers(100);

            // 2. ดึงข้อมูลจากคอลเลกชัน admins ใน Firestore (สถานะผูก LINE และรหัส)
            const adminsSnap = await adminDb.collection("admins").get();
            const adminsMap = {};
            adminsSnap.forEach((doc) => {
                adminsMap[doc.id] = doc.data();
            });

            // 3. ดึงชื่อร้านค้าจากคอลเลกชัน shops เพื่อผูกข้อมูล
            const shopsSnap = await adminDb.collection("shops").get();
            const shopsMap = {};
            shopsSnap.forEach((doc) => {
                const data = doc.data();
                if (data.ownerUid) {
                    shopsMap[data.ownerUid] = { id: doc.id, name: data.name };
                }
            });

            // 4. ประกอบข้อมูล
            const users = listUsersResult.users.map((u) => {
                const adminData = adminsMap[u.uid] || {};
                const shopData = shopsMap[u.uid] || null;
                const claims = u.customClaims || {};
                const isAdmin = claims.admin === true;
                const role = claims.adminRole || (isAdmin ? "super" : "user");

                return {
                    uid: u.uid,
                    email: u.email || "ไม่มีอีเมล",
                    role,
                    shop: shopData,
                    lineUserId: adminData.lineUserId || null,
                    lineLinkCode: adminData.lineLinkCode || null,
                    createdAt: u.metadata?.creationTime || null,
                    lastSignInTime: u.metadata?.lastSignInTime || null,
                };
            });

            return res.status(200).json({ users });
        } catch (err) {
            console.error("listUsers error:", err);
            return res.status(500).json({ error: "ดึงรายชื่อผู้ใช้ไม่สำเร็จ" });
        }
    }

    if (req.method === "POST") {
        const { targetUid, newRole, action } = req.body || {};

        // ---------- กรณี 1: รีเซ็ตการผูก LINE ของแอดมินรายบุคคล ----------
        if (action === "reset_admin_line") {
            if (!targetUid) return res.status(400).json({ error: "ระบุ targetUid ไม่ถูกต้อง" });

            try {
                const targetUser = await adminAuth.getUser(targetUid);
                const lineLinkCode = "ADMIN-" + Math.floor(100000 + Math.random() * 900000);

                await adminDb.collection("admins").doc(targetUid).set(
                    {
                        uid: targetUid,
                        email: targetUser.email,
                        lineUserId: null, // ปลดการผูก LINE เดิม
                        lineLinkCode,     // รหัสใหม่สำหรับนำไปพิมพ์ในแชท
                        lineResetAt: new Date(),
                        lineResetBy: superAdmin.email || superAdmin.uid,
                    },
                    { merge: true }
                );

                // หากเป็นบัญชี Super Admin ให้เคลียร์ lineUserId ใน config/admin ด้วย
                await adminDb.collection("config").doc("admin").set({ lineUserId: null }, { merge: true });

                await adminDb.collection("adminLogs").add({
                    action: "reset_admin_line",
                    targetType: "auth",
                    targetId: targetUid,
                    targetName: targetUser.email || targetUid,
                    detail: `Super Admin (${superAdmin.email || superAdmin.uid}) รีเซ็ตการผูก LINE ของ ${targetUser.email} และออกรหัสเชื่อมต่อใหม่: ${lineLinkCode}`,
                    status: "warning",
                    actorEmail: superAdmin.email || "Super Admin",
                    actorUid: superAdmin.uid,
                    createdAt: new Date(),
                });

                return res.status(200).json({
                    success: true,
                    lineLinkCode,
                    email: targetUser.email,
                });
            } catch (err) {
                console.error("reset_admin_line error:", err);
                return res.status(500).json({ error: "รีเซ็ตการผูก LINE ไม่สำเร็จ" });
            }
        }

        // ---------- กรณี 2: ล้างสิทธิ์แอดมินคนอื่นทั้งหมด เหลือเฉพาะ nathwrrthsumphlxy@gmail.com ----------
        if (action === "purge_all_other_admins") {
            try {
                const listUsersResult = await adminAuth.listUsers(200);
                let targetSuperUid = null;
                let revokedCount = 0;

                // 1. ตรวจสอบผู้ใช้ทั้งหมดใน Firebase Auth
                for (const u of listUsersResult.users) {
                    const isMaster = u.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
                    if (isMaster) {
                        targetSuperUid = u.uid;
                        await adminAuth.setCustomUserClaims(u.uid, { admin: true, adminRole: "super" });
                    } else if (u.customClaims?.admin === true) {
                        await adminAuth.setCustomUserClaims(u.uid, { admin: false, adminRole: null });
                        revokedCount++;
                    }
                }

                // 2. ลบเอกสารแอดมินคนอื่นออกจาก Firestore admins collection
                const adminsSnap = await adminDb.collection("admins").get();
                for (const doc of adminsSnap.docs) {
                    const data = doc.data();
                    const isMaster = data.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || doc.id === targetSuperUid;
                    if (!isMaster) {
                        await doc.ref.delete();
                    }
                }

                // 3. รีเซ็ตการผูก LINE ของ Super Admin หลัก และสร้างรหัสใหม่
                const freshLineCode = "ADMIN-" + Math.floor(100000 + Math.random() * 900000);
                if (targetSuperUid) {
                    await adminDb.collection("admins").doc(targetSuperUid).set(
                        {
                            uid: targetSuperUid,
                            email: MASTER_ADMIN_EMAIL,
                            role: "super",
                            lineUserId: null,
                            lineLinkCode: freshLineCode,
                            lineResetAt: new Date(),
                            updatedAt: new Date(),
                        },
                        { merge: true }
                    );
                }

                // 4. ล้าง lineUserId ใน config/admin
                await adminDb.collection("config").doc("admin").set({ lineUserId: null }, { merge: true });

                // 5. บันทึกประวัติ
                await adminDb.collection("adminLogs").add({
                    action: "purge_other_admins",
                    targetType: "system",
                    detail: `Super Admin สั่งล้างสิทธิ์แอดมินคนอื่นทั้งหมด (${revokedCount} คน) เหลือเฉพาะ ${MASTER_ADMIN_EMAIL} และรีเซ็ตการผูก LINE ของระบบทั้งหมด`,
                    status: "danger",
                    actorEmail: superAdmin.email || "Super Admin",
                    actorUid: superAdmin.uid,
                    createdAt: new Date(),
                });

                return res.status(200).json({
                    success: true,
                    revokedCount,
                    lineLinkCode: freshLineCode,
                    email: MASTER_ADMIN_EMAIL,
                    message: `ล้างสิทธิ์แอดมินคนอื่นสำเร็จ (${revokedCount} คน) และรีเซ็ตการผูก LINE ของคุณเรียบร้อยแล้ว`,
                });
            } catch (err) {
                console.error("purge_all_other_admins error:", err);
                return res.status(500).json({ error: "ล้างสิทธิ์แอดมินไม่สำเร็จ: " + err.message });
            }
        }

        // ---------- กรณี 3: ปรับระดับสิทธิ์ปกติ (super, normal, user) ----------
        if (!targetUid || !["super", "normal", "user"].includes(newRole)) {
            return res.status(400).json({ error: "ข้อมูลบทบาทไม่ถูกต้อง" });
        }

        try {
            const targetUser = await adminAuth.getUser(targetUid);

            if (newRole === "user") {
                // ถอดสิทธิ์แอดมิน
                await adminAuth.setCustomUserClaims(targetUid, {
                    admin: false,
                    adminRole: null,
                });

                // ลบเอกสารออกจากคอลเลกชัน admins
                await adminDb.collection("admins").doc(targetUid).delete();

                // บันทึก Audit Log
                await adminDb.collection("adminLogs").add({
                    action: "revoke_admin_role",
                    targetType: "auth",
                    targetId: targetUid,
                    targetName: targetUser.email || targetUid,
                    detail: `Super Admin (${superAdmin.email || superAdmin.uid}) ถอดสิทธิ์แอดมินของ ${targetUser.email}`,
                    status: "warning",
                    actorEmail: superAdmin.email || "Super Admin",
                    actorUid: superAdmin.uid,
                    createdAt: new Date(),
                });

                return res.status(200).json({ success: true, role: "user" });
            }

            // ตั้งสิทธิ์เป็น super หรือ normal
            await adminAuth.setCustomUserClaims(targetUid, {
                admin: true,
                adminRole: newRole,
            });

            // สร้างรหัสเชื่อมต่อ LINE แอดมินเฉพาะบุคคล
            const lineLinkCode = "ADMIN-" + Math.floor(100000 + Math.random() * 900000);

            await adminDb.collection("admins").doc(targetUid).set(
                {
                    uid: targetUid,
                    email: targetUser.email,
                    role: newRole,
                    lineUserId: null, // รีเซ็ตการผูกไว้ก่อน รอแอดมินส่งรหัส
                    lineLinkCode,
                    grantedBy: superAdmin.email || superAdmin.uid,
                    grantedAt: new Date(),
                },
                { merge: true }
            );

            // บันทึก Audit Log
            await adminDb.collection("adminLogs").add({
                action: "grant_admin_role",
                targetType: "auth",
                targetId: targetUid,
                targetName: targetUser.email || targetUid,
                detail: `Super Admin (${superAdmin.email || superAdmin.uid}) แต่งตั้ง ${targetUser.email} เป็น ${newRole === "super" ? "Super Admin" : "Normal Admin"} พร้อมออกรหัสเชื่อมต่อ LINE: ${lineLinkCode}`,
                status: "success",
                actorEmail: superAdmin.email || "Super Admin",
                actorUid: superAdmin.uid,
                metadata: { newRole, lineLinkCode },
                createdAt: new Date(),
            });

            return res.status(200).json({
                success: true,
                role: newRole,
                lineLinkCode,
                email: targetUser.email,
            });
        } catch (err) {
            console.error("setAdminRole error:", err);
            return res.status(500).json({ error: "ปรับสิทธิ์ผู้ใช้ไม่สำเร็จ" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
