import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Middleware สำหรับจำลอง API responses ในสภาพแวดล้อม Local Development (Vite Dev Server)
 * เพื่อป้องกัน Error 404 ใน Browser Console เวลาทดสอบสมัครร้าน หรือแจ้งเตือนระบบ
 */
let devUsers = [
    {
        uid: "user-nathwrrthsumphlxy",
        email: "nathwrrthsumphlxy@gmail.com",
        role: "super",
        shop: null,
        lineUserId: null, // รีเซ็ตการผูก LINE ตามคำขอ
        lineLinkCode: "ADMIN-892154", // รหัสผูกใหม่พร้อมใช้งาน
        createdAt: new Date().toISOString(),
    },
    {
        uid: "dev-seller-1",
        email: "student1@rittiya.ac.th",
        role: "user",
        shop: { id: "shop1", name: "ร้านน้ำผลไม้ปั่น ม.6" },
        lineUserId: null,
        lineLinkCode: null,
        createdAt: new Date().toISOString(),
    },
    {
        uid: "dev-seller-2",
        email: "student2@rittiya.ac.th",
        role: "user",
        shop: { id: "shop2", name: "ร้านขนมปังเนยสด ม.5/2" },
        lineUserId: null,
        lineLinkCode: null,
        createdAt: new Date().toISOString(),
    },
];

function localApiDevPlugin() {
    return {
        name: "local-api-dev-middleware",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url && req.url.startsWith("/api/")) {
                    res.setHeader("Content-Type", "application/json");
                    res.statusCode = 200;
                    console.log(`[Vite Dev API] Handled ${req.method} ${req.url}`);

                    if (req.url.startsWith("/api/manageAdminRoles")) {
                        if (req.method === "POST") {
                            let body = "";
                            req.on("data", (chunk) => {
                                body += chunk;
                            });
                            req.on("end", () => {
                                try {
                                    const parsed = JSON.parse(body || "{}");
                                    const { targetUid, newRole, action } = parsed;

                                    if (action === "reset_admin_line") {
                                        const user = devUsers.find((u) => u.uid === targetUid);
                                        const newCode = "ADMIN-" + Math.floor(100000 + Math.random() * 900000);
                                        if (user) {
                                            user.lineUserId = null;
                                            user.lineLinkCode = newCode;
                                        }
                                        res.end(JSON.stringify({ success: true, lineLinkCode: newCode, email: user?.email }));
                                        return;
                                    }

                                    if (action === "purge_all_other_admins") {
                                        const freshCode = "ADMIN-" + Math.floor(100000 + Math.random() * 900000);
                                        devUsers.forEach((u) => {
                                            if (u.email === "nathwrrthsumphlxy@gmail.com") {
                                                u.role = "super";
                                                u.lineUserId = null;
                                                u.lineLinkCode = freshCode;
                                            } else {
                                                u.role = "user";
                                                u.lineUserId = null;
                                                u.lineLinkCode = null;
                                            }
                                        });
                                        res.end(
                                            JSON.stringify({
                                                success: true,
                                                revokedCount: 0,
                                                lineLinkCode: freshCode,
                                                email: "nathwrrthsumphlxy@gmail.com",
                                                message: "ล้างสิทธิ์แอดมินคนอื่นทั้งหมด และรีเซ็ตการผูก LINE ของคุณเรียบร้อยแล้ว",
                                            })
                                        );
                                        return;
                                    }

                                    const user = devUsers.find((u) => u.uid === targetUid);
                                    if (user && newRole) {
                                        user.role = newRole;
                                        if (newRole !== "user") {
                                            user.lineUserId = null;
                                            user.lineLinkCode = "ADMIN-" + Math.floor(100000 + Math.random() * 900000);
                                        } else {
                                            user.lineLinkCode = null;
                                            user.lineUserId = null;
                                        }
                                        res.end(JSON.stringify({ success: true, role: newRole, lineLinkCode: user.lineLinkCode }));
                                        return;
                                    }

                                    res.end(JSON.stringify({ success: true }));
                                } catch (e) {
                                    res.end(JSON.stringify({ success: false, error: e.message }));
                                }
                            });
                            return;
                        }

                        // GET method
                        res.end(
                            JSON.stringify({
                                success: true,
                                devMode: true,
                                users: devUsers,
                            })
                        );
                        return;
                    }

                    const isOrder = req.url.startsWith("/api/createOrder");
                    res.end(
                        JSON.stringify({
                            success: true,
                            devMode: true,
                            orderId: isOrder ? "DEV-" + Date.now().toString(36).toUpperCase() : undefined,
                            total: 0,
                            paymentInfo: null,
                            message: "Handled gracefully in local dev",
                        })
                    );
                    return;
                }
                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [react(), localApiDevPlugin()],
});
