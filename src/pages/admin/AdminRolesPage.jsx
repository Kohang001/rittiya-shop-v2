// src/pages/admin/AdminRolesPage.jsx
// แผงควบคุมรายชื่อผู้ใช้และจัดการระดับสิทธิ์ Admin (Super vs Normal) พร้อมออกรหัสเชื่อมต่อ LINE
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { saveAdminLinePairingCode } from "../../firebase/firestore";
import AdminNav from "../../components/layout/AdminNav";
import Breadcrumb from "../../components/ui/Breadcrumb";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";

export default function AdminRolesPage() {
    const { user, isSuperAdmin } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // "all" | "super" | "normal" | "user"

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null); // ผู้ใช้ที่กำลังจะปรับสิทธิ์
    const [targetRole, setTargetRole] = useState("normal");
    const [saving, setSaving] = useState(false);
    const [pairingModalData, setPairingModalData] = useState(null); // { email, role, lineLinkCode }
    const [copied, setCopied] = useState(false);
    const [myProfile, setMyProfile] = useState(null);

    useEffect(() => {
        loadUsers();
    }, [user]);

    async function loadUsers() {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/manageAdminRoles", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
            setUsers(data.users || []);
            setMyProfile(data.myProfile || null);
        } catch (err) {
            console.error("loadUsers error:", err);
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetMyLine() {
        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/manageAdminRoles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: "reset_my_line" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "ขอรหัสใหม่ไม่สำเร็จ");
            showToast("สร้างรหัสเชื่อมต่อชุดใหม่เรียบร้อยแล้ว", "success");
            await loadUsers();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleUnlinkMyLine() {
        if (!window.confirm("ยืนยันยกเลิกการเชื่อมต่อ LINE? คุณจะไม่ได้รับการแจ้งเตือนทาง LINE จนกว่าจะผูกใหม่")) return;
        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/manageAdminRoles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: "unlink_my_line" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "ยกเลิกไม่สำเร็จ");
            showToast("ยกเลิกการเชื่อมต่อ LINE เรียบร้อยแล้ว", "info");
            await loadUsers();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveRole(e) {
        e.preventDefault();
        if (!selectedUser) return;
        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/manageAdminRoles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetUid: selectedUser.uid,
                    newRole: targetRole,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "ปรับระดับสิทธิ์ไม่สำเร็จ");

            showToast("ปรับระดับสิทธิ์ผู้ใช้สำเร็จ", "success");
            const updatedUser = selectedUser;
            setSelectedUser(null);
            await loadUsers();

            // หากแต่งตั้งเป็น Admin ให้เปิด Modal แสดงรหัสผูก LINE
            if (data.lineLinkCode) {
                setPairingModalData({
                    email: updatedUser.email,
                    role: targetRole,
                    lineLinkCode: data.lineLinkCode,
                });
            }
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleResetLineLink(targetUser) {
        if (!user || !targetUser) return;
        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/manageAdminRoles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: "reset_admin_line",
                    targetUid: targetUser.uid,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "รีเซ็ตการผูก LINE ไม่สำเร็จ");

            // บันทึกลง Firestore คอลเลกชัน admins โดยตรง
            if (data.lineLinkCode) {
                await saveAdminLinePairingCode(targetUser.uid, targetUser.email, targetUser.role, data.lineLinkCode);
            }

            showToast("รีเซ็ตการผูก LINE และออกรหัสเชื่อมต่อใหม่แล้ว", "success");
            await loadUsers();

            setPairingModalData({
                email: targetUser.email,
                role: targetUser.role,
                lineLinkCode: data.lineLinkCode,
            });
        } catch (err) {
            console.error("handleResetLineLink error:", err);
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    }

    async function handlePurgeOtherAdmins() {
        if (!user) return;
        const confirmPurge = window.confirm(
            "ยืนยันการล้างสิทธิ์แอดมินคนอื่นทั้งหมด?\n\n- แอดมินทุกคนจะถูกถอดสิทธิ์ เหลือเฉพาะบัญชี Super Admin (nathwrrthsumphlxy@gmail.com)\n- การผูก LINE ของระบบจะถูกรีเซ็ตใหม่ทั้งหมด เพื่อให้คุณผูกใหม่ได้ทันที"
        );
        if (!confirmPurge) return;

        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/manageAdminRoles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: "purge_all_other_admins",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "ดำเนินการไม่สำเร็จ");

            // บันทึกลง Firestore คอลเลกชัน admins โดยตรง
            if (data.lineLinkCode && user?.uid) {
                await saveAdminLinePairingCode(user.uid, data.email || user.email, "super", data.lineLinkCode);
            }

            showToast(data.message || "ล้างสิทธิ์แอดมินคนอื่นทั้งหมดสำเร็จ", "success");
            await loadUsers();

            if (data.lineLinkCode) {
                setPairingModalData({
                    email: data.email || "nathwrrthsumphlxy@gmail.com",
                    role: "super",
                    lineLinkCode: data.lineLinkCode,
                });
            }
        } catch (err) {
            console.error("handlePurgeOtherAdmins error:", err);
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    }

    function handleCopyCode(code) {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    // สถิติ
    const superCount = useMemo(() => users.filter((u) => u.role === "super").length, [users]);
    const normalCount = useMemo(() => users.filter((u) => u.role === "normal").length, [users]);
    const generalUserCount = useMemo(() => users.filter((u) => u.role === "user").length, [users]);

    // กรองผู้ใช้ตามคำค้นหาและแท็บ
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const q = searchQuery.toLowerCase().trim();
            const matchSearch =
                !q ||
                u.email?.toLowerCase().includes(q) ||
                u.shop?.name?.toLowerCase().includes(q) ||
                u.uid?.toLowerCase().includes(q);

            const matchTab =
                activeTab === "all" ||
                (activeTab === "super" && u.role === "super") ||
                (activeTab === "normal" && u.role === "normal") ||
                (activeTab === "user" && u.role === "user");

            return matchSearch && matchTab;
        });
    }, [users, searchQuery, activeTab]);

    if (!isSuperAdmin) {
        const isConnected = Boolean(myProfile?.lineUserId);

        return (
            <div>
                <AdminNav />

                <main style={{ maxWidth: 640, margin: "32px auto", padding: "0 16px" }}>
                    <Breadcrumb items={[{ label: "ภาพรวม", to: "/admin" }, { label: "LINE แอดมิน" }]} />

                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "rgba(14, 165, 233, 0.12)",
                                    color: "#0ea5e9",
                                    border: "1px solid rgba(14, 165, 233, 0.25)",
                                }}
                            >
                                NORMAL ADMIN PROFILE
                            </span>
                        </div>
                        <h1 style={{ fontSize: "clamp(20px, 3vw, 24px)", fontWeight: 700, margin: "0 0 6px 0" }}>
                            การเชื่อมต่อ LINE ผู้ดูแลระบบ
                        </h1>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                            บัญชี: <strong>{user?.email}</strong> · จัดการการผูกบัญชี LINE สำหรับรับแจ้งเตือนร้านค้าและสินค้าใหม่
                        </p>
                    </div>

                    {/* กล่องคำสั่งยกเลิกกำกับหน้าแอดมิน */}
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 20,
                            fontSize: 13,
                            color: "#b45309",
                        }}
                    >
                        <Icon name="info" size={16} />
                        <div>
                            <strong>คำสั่งยกเลิกผูกในแชท:</strong> หากต้องการยกเลิกการเชื่อมต่อ ให้พิมพ์คำว่า{" "}
                            <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 700, color: "#d97706" }}>
                                unlink
                            </code>{" "}
                            ในแชท LINE OA ได้ทันที
                        </div>
                    </div>

                    {isConnected ? (
                        <div
                            className="card"
                            style={{
                                padding: 24,
                                textAlign: "center",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                background: "rgba(16, 185, 129, 0.04)",
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    background: "rgba(16, 185, 129, 0.12)",
                                    color: "var(--color-success)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 12px",
                                }}
                            >
                                <Icon name="check-circle" size={26} color="var(--color-success)" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                                เชื่อมต่อ LINE เรียบร้อยแล้ว
                            </h3>
                            <p style={{ margin: "8px 0 16px", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                                บัญชีผู้ดูแลระบบของคุณผูกกับ LINE Official Account แล้ว<br />
                                คุณจะได้รับการแจ้งเตือนร้านใหม่และสินค้าใหม่ทาง LINE ทันที
                            </p>

                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 12px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "var(--color-bg-subtle)",
                                    fontSize: 12,
                                    color: "var(--color-text-muted)",
                                    marginBottom: 20,
                                }}
                            >
                                <Icon name="shield" size={14} color="var(--color-success)" />
                                รหัสเชื่อมต่อเดิมถูกล้างทิ้งอัตโนมัติแล้ว (One-Time Token)
                            </div>

                            <div>
                                <button
                                    type="button"
                                    onClick={handleUnlinkMyLine}
                                    disabled={saving}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        color: "var(--color-danger, #ef4444)",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    {saving ? "กำลังดำเนินการ..." : "ยกเลิกการเชื่อมต่อ LINE"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="card"
                            style={{
                                padding: 24,
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <h3 style={{ fontSize: 15, margin: "0 0 12px 0", fontWeight: 600 }}>
                                สแกน QR Code เพื่อเปิดแชท LINE Official Account
                            </h3>

                            <img
                                src="/line-qr.png"
                                alt="LINE Official Account QR Code"
                                style={{
                                    width: 180,
                                    height: 180,
                                    objectFit: "contain",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--color-border)",
                                    padding: 8,
                                    background: "#fff",
                                    marginBottom: 16,
                                }}
                            />

                            <h3 style={{ fontSize: 15, margin: "0 0 6px 0", fontWeight: 600 }}>
                                ส่งรหัส Admin รูปแบบตายตัวด้านล่างนี้ในแชท:
                            </h3>
                            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px 0", maxWidth: 360 }}>
                                กรุณาพิมพ์รหัสให้ครบทั้งตัวอักษร <strong>ADMIN-</strong> และตัวเลข 6 หลัก (ใช้ได้ครั้งเดียวเพื่อความปลอดภัย)
                            </p>

                            {myProfile?.lineLinkCode ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                    <div
                                        style={{
                                            background: "var(--color-bg-subtle)",
                                            border: "2px dashed var(--color-primary)",
                                            borderRadius: "var(--radius-md)",
                                            padding: "10px 24px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 24,
                                                fontWeight: 800,
                                                letterSpacing: 2,
                                                color: "var(--color-primary)",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {myProfile.lineLinkCode}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(myProfile.lineLinkCode)}
                                            style={{
                                                background: "none",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "var(--radius-sm)",
                                                padding: "6px 10px",
                                                cursor: "pointer",
                                                fontSize: 12,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                color: copied ? "var(--color-success)" : "var(--color-text-muted)",
                                            }}
                                        >
                                            <Icon name={copied ? "check" : "copy"} size={14} />
                                            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleResetMyLine}
                                        disabled={saving}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "var(--color-text-muted)",
                                            fontSize: 12,
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                            padding: 4,
                                        }}
                                    >
                                        {saving ? "กำลังสร้างรหัส..." : "รหัสหมดอายุหรือไม่ทำงาน? ขอรหัสเชื่อมต่อชุดใหม่"}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResetMyLine}
                                    disabled={saving}
                                    className="nav-link-btn"
                                    style={{ justifyContent: "center", padding: "8px 20px", fontSize: 13 }}
                                >
                                    <Icon name="refresh" size={14} />
                                    {saving ? "กำลังสร้างรหัส..." : "ขอรหัสเชื่อมต่อ LINE (รหัสใช้ครั้งเดียว)"}
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div>
            <AdminNav />

            <main style={{ maxWidth: 1040, margin: "32px auto", padding: "0 16px" }}>
                <Breadcrumb items={[{ label: "ภาพรวม", to: "/admin" }, { label: "จัดการสิทธิ์ Admin" }]} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                    <div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "rgba(99, 102, 241, 0.12)",
                                    color: "#6366f1",
                                    border: "1px solid rgba(99, 102, 241, 0.25)",
                                }}
                            >
                                SUPER ADMIN PRIVILEGE
                            </span>
                        </div>
                        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                            จัดการสิทธิ์ Admin & รายชื่อผู้ใช้
                        </h1>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)" }}>
                            แต่งตั้งและควบคุมระดับขั้น Super Admin / Normal Admin พร้อมออกรหัสเชื่อมต่อ LINE แจ้งเตือน
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={handlePurgeOtherAdmins}
                            disabled={saving}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                background: "var(--color-status-rejected-bg)",
                                color: "var(--color-danger)",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                            title="ล้างสิทธิ์แอดมินคนอื่นทั้งหมด เหลือเฉพาะ nathwrrthsumphlxy@gmail.com และรีเซ็ตการผูก LINE"
                        >
                            <Icon name="trash" size={13} color="var(--color-danger)" /> ล้างสิทธิ์แอดมินอื่นทั้งหมด
                        </button>
                        <button
                            type="button"
                            onClick={loadUsers}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                background: "var(--color-bg-surface)",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            <Icon name="sparkle" size={13} color="var(--color-primary)" /> รีเฟรชรายชื่อ
                        </button>
                    </div>
                </div>

                {/* Super Admin Personal LINE Connection Banner */}
                <div
                    className="card"
                    style={{
                        padding: "16px 20px",
                        marginBottom: 20,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 14,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "var(--radius-sm)",
                                background: myProfile?.lineUserId ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                                color: myProfile?.lineUserId ? "var(--color-success)" : "#d97706",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Icon name={myProfile?.lineUserId ? "check-circle" : "shield"} size={22} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <strong style={{ fontSize: 14, color: "var(--color-text)" }}>
                                    สถานะ LINE ของคุณ ({user?.email})
                                </strong>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding: "1px 6px",
                                        borderRadius: 4,
                                        background: myProfile?.lineUserId ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                        color: myProfile?.lineUserId ? "var(--color-success)" : "#d97706",
                                    }}
                                >
                                    {myProfile?.lineUserId ? "ผูก LINE แล้ว" : "ยังไม่ผูก LINE"}
                                </span>
                            </div>
                            <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                                {myProfile?.lineUserId
                                    ? `หากต้องการยกเลิกการเชื่อมต่อ ให้พิมพ์คำว่า "unlink" ในแชท LINE OA หรือกดปุ่มด้านขวา`
                                    : `พิมพ์รหัส ${myProfile?.lineLinkCode || "ADMIN-xxxxxx"} ส่งในแชท LINE เพื่อเชื่อมต่อ (พิมพ์คำว่า "unlink" เพื่อยกเลิก)`}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {myProfile?.lineUserId ? (
                            <button
                                type="button"
                                onClick={handleUnlinkMyLine}
                                disabled={saving}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg-surface)",
                                    color: "var(--color-danger, #ef4444)",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: 500,
                                }}
                            >
                                ยกเลิกผูก LINE
                            </button>
                        ) : myProfile?.lineLinkCode ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "var(--color-primary)" }}>
                                    {myProfile.lineLinkCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyCode(myProfile.lineLinkCode)}
                                    style={{
                                        padding: "5px 10px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetMyLine}
                                    disabled={saving}
                                    style={{
                                        padding: "5px 10px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    ขอรหัสใหม่
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResetMyLine}
                                disabled={saving}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "var(--color-primary)",
                                    color: "#fff",
                                    border: "none",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                ขอรหัสเชื่อมต่อ LINE
                            </button>
                        )}
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 14,
                        marginBottom: 24,
                    }}
                >
                    <div className="card" style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>Super Admins</span>
                        <div style={{ fontSize: 26, fontWeight: 700, color: "#6366f1", marginTop: 4 }}>
                            {superCount} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)" }}>คน</span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>สิทธิ์เต็ม ดูข้อมูลการเงินได้</p>
                    </div>

                    <div className="card" style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>Normal Admins</span>
                        <div style={{ fontSize: 26, fontWeight: 700, color: "#3b82f6", marginTop: 4 }}>
                            {normalCount} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)" }}>คน</span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>ผู้ดูแลทั่วไป (ซ่อนข้อมูลการเงิน)</p>
                    </div>

                    <div className="card" style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>ผู้ใช้ทั้งหมด / แม่ค้า</span>
                        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>
                            {users.length} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)" }}>คน</span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>บัญชีที่ลงทะเบียนในระบบ</p>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 280px" }}>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาด้วยอีเมล, ชื่อร้าน, หรือ UID..."
                            style={{
                                width: "100%",
                                padding: "9px 12px 9px 36px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                fontSize: 13,
                                background: "var(--color-bg-surface)",
                            }}
                        />
                        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                            <Icon name="search" size={15} color="var(--color-text-muted)" />
                        </div>
                    </div>

                    {/* Vercel-style Tab Pills */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[
                            { id: "all", label: "ทั้งหมด", count: users.length },
                            { id: "super", label: "Super Admin", count: superCount },
                            { id: "normal", label: "Normal Admin", count: normalCount },
                            { id: "user", label: "ผู้ใช้ทั่วไป", count: generalUserCount },
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 12px",
                                        borderRadius: "var(--radius-sm)",
                                        border: isActive ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                        background: isActive ? "var(--color-primary)" : "var(--color-bg-surface)",
                                        color: isActive ? "#ffffff" : "var(--color-text)",
                                        fontSize: 12,
                                        fontWeight: isActive ? 600 : 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            padding: "1px 6px",
                                            borderRadius: 10,
                                            background: isActive ? "rgba(255,255,255,0.25)" : "var(--color-bg-subtle)",
                                            color: isActive ? "#ffffff" : "var(--color-text-muted)",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* User List */}
                {loading ? (
                    <PageSkeleton lines={6} />
                ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: "48px 16px", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}>
                        <Icon name="box" size={36} color="var(--color-text-muted)" />
                        <p style={{ margin: "10px 0 0 0", fontSize: 14 }}>ไม่พบผู้ใช้ที่ตรงกับการค้นหา</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filteredUsers.map((u) => {
                            const isSuper = u.role === "super";
                            const isNormal = u.role === "normal";
                            const isSelf = u.uid === user.uid;

                            return (
                                <div
                                    key={u.uid}
                                    className="card"
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: 14,
                                        borderRadius: "var(--radius-md)",
                                        border: isSuper ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        flexWrap: "wrap",
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "var(--radius-sm)",
                                                background: isSuper
                                                    ? "rgba(99, 102, 241, 0.1)"
                                                    : isNormal
                                                    ? "rgba(59, 130, 246, 0.1)"
                                                    : "var(--color-bg-subtle)",
                                                color: isSuper ? "#6366f1" : isNormal ? "#3b82f6" : "var(--color-text-muted)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: 700,
                                                fontSize: 16,
                                                border: "1px solid var(--color-border)",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {u.email ? u.email.charAt(0).toUpperCase() : "U"}
                                        </div>

                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>{u.email}</span>
                                                {isSelf && (
                                                    <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}>
                                                        บัญชีของคุณ
                                                    </span>
                                                )}
                                                {isSuper ? (
                                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
                                                        Super Admin
                                                    </span>
                                                ) : isNormal ? (
                                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
                                                        Normal Admin
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                                                        ผู้ใช้ทั่วไป
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
                                                {u.shop ? (
                                                    <span>ร้านค้า: <strong>{u.shop.name}</strong></span>
                                                ) : (
                                                    <span>ไม่มีร้านค้า</span>
                                                )}
                                                <span>·</span>
                                                {/* สถานะผูก LINE */}
                                                {u.lineUserId ? (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-success)" }}>
                                                        <span className="pulse-dot pulse-dot--success" /> ผูก LINE แล้ว
                                                    </span>
                                                ) : u.lineLinkCode ? (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#d97706" }}>
                                                        <span className="pulse-dot pulse-dot--warning" /> รหัสผูก LINE: <strong>{u.lineLinkCode}</strong>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--color-text-muted)" }}>ยังไม่ผูก LINE</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                                        {/* ปุ่มรีเซ็ตการผูก LINE สำหรับ Admin ทุกคน */}
                                        {(u.role === "super" || u.role === "normal") && (
                                            <button
                                                type="button"
                                                onClick={() => handleResetLineLink(u)}
                                                disabled={saving}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    borderRadius: "var(--radius-sm)",
                                                    border: "1px solid var(--color-border)",
                                                    background: "var(--color-bg-subtle)",
                                                    color: "var(--color-text)",
                                                    cursor: "pointer",
                                                }}
                                                title="รีเซ็ตการผูก LINE เดิม และออกรหัสเชื่อมต่อใหม่"
                                            >
                                                <Icon name="megaphone" size={13} />
                                                <span>รีเซ็ตผูก LINE</span>
                                            </button>
                                        )}

                                        {u.lineLinkCode && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCode(u.lineLinkCode)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    background: "var(--color-bg-subtle)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "var(--radius-sm)",
                                                    cursor: "pointer",
                                                }}
                                                title="คัดลอกรหัสผูก LINE"
                                            >
                                                <Icon name={copied ? "check" : "copy"} size={13} color={copied ? "var(--color-success)" : "currentColor"} />
                                                <span>{copied ? "คัดลอกแล้ว" : u.lineLinkCode}</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setTargetRole(u.role === "user" ? "normal" : u.role);
                                            }}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                padding: "6px 12px",
                                                fontSize: 12,
                                                fontWeight: 500,
                                                borderRadius: "var(--radius-sm)",
                                                border: "1px solid var(--color-border)",
                                                background: "var(--color-bg-surface)",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <Icon name="settings" size={13} />
                                            ปรับสิทธิ์
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modal ปรับระดับสิทธิ์ */}
            {selectedUser && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(4px)",
                        WebkitBackdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        zIndex: 1000,
                    }}
                    onClick={() => !saving && setSelectedUser(null)}
                >
                    <div
                        className="card"
                        style={{
                            width: "100%",
                            maxWidth: 440,
                            padding: 24,
                            borderRadius: "var(--radius-md)",
                            background: "#ffffff",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                            border: "1px solid var(--color-border)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: "0 0 6px 0", fontSize: 18 }}>ปรับระดับสิทธิ์ผู้ใช้</h3>
                        <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                            บัญชี: <strong>{selectedUser.email}</strong>
                        </p>

                        <form onSubmit={handleSaveRole}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10,
                                        padding: 12,
                                        borderRadius: "var(--radius-sm)",
                                        border: targetRole === "super" ? "2px solid #6366f1" : "1px solid var(--color-border)",
                                        background: targetRole === "super" ? "rgba(99, 102, 241, 0.08)" : "#ffffff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="super"
                                        checked={targetRole === "super"}
                                        onChange={() => setTargetRole("super")}
                                        style={{ marginTop: 2 }}
                                    />
                                    <div>
                                        <strong style={{ display: "block", color: "#6366f1", fontSize: 14 }}>Super Admin (สิทธิ์สูงสุด)</strong>
                                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                                             เข้าถึงได้ทุกส่วน ดูข้อมูลการเงินร้านค้าได้ และสามารถแต่งตั้ง/ลดสิทธิ์แอดมินคนอื่นได้
                                        </span>
                                    </div>
                                </label>

                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10,
                                        padding: 12,
                                        borderRadius: "var(--radius-sm)",
                                        border: targetRole === "normal" ? "2px solid #3b82f6" : "1px solid var(--color-border)",
                                        background: targetRole === "normal" ? "rgba(59, 130, 246, 0.08)" : "#ffffff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="normal"
                                        checked={targetRole === "normal"}
                                        onChange={() => setTargetRole("normal")}
                                        style={{ marginTop: 2 }}
                                    />
                                    <div>
                                        <strong style={{ display: "block", color: "#3b82f6", fontSize: 14 }}>Normal Admin (ผู้ดูแลทั่วไป)</strong>
                                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                                            ดูแลร้านค้า สินค้า ออเดอร์ และโพสต์ได้ แต่ถูกซ่อน/พรางข้อมูลการเงินของร้านค้า
                                        </span>
                                    </div>
                                </label>

                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10,
                                        padding: 12,
                                        borderRadius: "var(--radius-sm)",
                                        border: targetRole === "user" ? "2px solid var(--color-danger)" : "1px solid var(--color-border)",
                                        background: targetRole === "user" ? "rgba(239, 68, 68, 0.08)" : "#ffffff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="user"
                                        checked={targetRole === "user"}
                                        onChange={() => setTargetRole("user")}
                                        style={{ marginTop: 2 }}
                                    />
                                    <div>
                                        <strong style={{ display: "block", color: "var(--color-danger)", fontSize: 14 }}>ถอดสิทธิ์แอดมิน (ผู้ใช้ทั่วไป)</strong>
                                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                                            ยกเลิกสิทธิ์เข้าถึงระบบ Admin ให้กลับเป็นผู้ใช้งานหรือแม่ค้าทั่วไป
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedUser(null)}
                                    disabled={saving}
                                    style={{ flex: 1, padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text)", cursor: "pointer" }}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ flex: 1, padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--color-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                                >
                                    {saving ? "กำลังบันทึก..." : "ยืนยันสิทธิ์"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal แสดงรหัสผูก LINE เมื่อแต่งตั้ง Admin สำเร็จ */}
            {pairingModalData && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(4px)",
                        WebkitBackdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        zIndex: 1000,
                    }}
                    onClick={() => setPairingModalData(null)}
                >
                    <div
                        className="card"
                        style={{
                            width: "100%",
                            maxWidth: 440,
                            padding: 24,
                            borderRadius: "var(--radius-md)",
                            background: "#ffffff",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                            border: "1px solid var(--color-border)",
                            textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: 12 }}>
                            <Icon name="verified-shield" size={44} color="var(--color-success)" />
                        </div>

                        <h3 style={{ margin: "0 0 6px 0", fontSize: 18 }}>แต่งตั้งผู้ดูแลระบบสำเร็จ</h3>
                        <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                            บัญชี <strong>{pairingModalData.email}</strong> ได้รับสิทธิ์เป็น{" "}
                            <span style={{ fontWeight: 700, color: pairingModalData.role === "super" ? "#6366f1" : "#3b82f6" }}>
                                {pairingModalData.role === "super" ? "Super Admin" : "Normal Admin"}
                            </span>{" "}
                            เรียบร้อยแล้ว
                        </p>

                        <div
                            style={{
                                padding: "16px 20px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px dashed var(--color-primary)",
                                background: "var(--color-bg-subtle)",
                                marginBottom: 16,
                            }}
                        >
                            <span style={{ fontSize: 12, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
                                รหัสเชื่อมต่อ LINE แจ้งเตือนของแอดมินคนนี้:
                            </span>
                            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, color: "var(--color-primary)", marginBottom: 10 }}>
                                {pairingModalData.lineLinkCode}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCopyCode(pairingModalData.lineLinkCode)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 14px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg-surface)",
                                    cursor: "pointer",
                                }}
                            >
                                <Icon name={copied ? "check" : "copy"} size={13} color={copied ? "var(--color-success)" : "currentColor"} />
                                <span>{copied ? "คัดลอกรหัสแล้ว!" : "คัดลอกรหัส"}</span>
                            </button>
                        </div>

                        <p style={{ margin: "0 0 20px 0", fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                            คำแนะนำ: ส่งรหัสนี้ให้ผู้ดูแลระบบคนดังกล่าวพิมพ์ส่งใน LINE Official Account ของโรงเรียนเพื่อเริ่มรับการแจ้งเตือน
                        </p>

                        <button
                            type="button"
                            onClick={() => setPairingModalData(null)}
                            style={{
                                width: "100%",
                                padding: "8px 16px",
                                borderRadius: "var(--radius-sm)",
                                border: "none",
                                background: "var(--color-primary)",
                                color: "#fff",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            เข้าใจแล้ว ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

