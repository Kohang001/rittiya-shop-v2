// src/pages/admin/AdminFeedPage.jsx
import { useEffect, useState } from "react";
import {
    getAllFeedPostsForAdmin,
    hideFeedPost,
    unhideFeedPost,
    createFeedPost,
    getAllShopsForAdmin,
} from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AdminNav from "../../components/layout/AdminNav";
import Breadcrumb from "../../components/ui/Breadcrumb";
import ConfirmModal from "../../components/ui/ConfirmModal";
import PageSkeleton from "../../components/ui/PageSkeleton";
import ImageUploadField from "../../components/form/ImageUploadField";
import Icon from "../../components/ui/Icon";

export default function AdminFeedPage() {
    const { user, isSuperAdmin } = useAuth();
    const { showToast } = useToast();
    const [posts, setPosts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { type: "hide"|"unhide", postId }

    // Modal สร้างประกาศใหม่
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [selectedShopId, setSelectedShopId] = useState("system"); // "system" หรือ shopId
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const [postsData, shopsData] = await Promise.all([
                getAllFeedPostsForAdmin().catch(() => []),
                getAllShopsForAdmin().catch(() => []),
            ]);
            setPosts(postsData);
            setShops(shopsData);
        } catch (err) {
            console.error("load feed error:", err);
            showToast("โหลดประกาศไม่สำเร็จ", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirmed() {
        const { type, postId } = confirmAction;
        const post = posts.find((p) => p.id === postId);
        setConfirmAction(null);
        setBusyId(postId);
        try {
            if (type === "hide") {
                await hideFeedPost(postId, { postTitle: post?.title });
                showToast("ซ่อนประกาศแล้ว", "success");
            } else {
                await unhideFeedPost(postId, { postTitle: post?.title });
                showToast("ยกเลิกซ่อนแล้ว — โพสต์กลับมาแสดงใน Feed", "success");
            }
            await load();
        } catch {
            showToast(type === "hide" ? "ซ่อนประกาศไม่สำเร็จ" : "ยกเลิกซ่อนไม่สำเร็จ", "error");
        } finally {
            setBusyId(null);
        }
    }

    async function handleCreatePost(e) {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) {
            showToast("กรุณากรอกหัวข้อและข้อความประกาศ", "error");
            return;
        }

        setSubmitting(true);
        try {
            let shopName = "Rittiya Shop (ประกาศจากระบบ)";
            let shopLogoUrl = "";
            let postShopId = selectedShopId;

            if (selectedShopId !== "system") {
                const targetShop = shops.find((s) => s.id === selectedShopId);
                if (targetShop) {
                    shopName = targetShop.name || "ร้านค้า";
                    shopLogoUrl = targetShop.logoUrl || "";
                }
            }

            await createFeedPost({
                shopId: postShopId,
                title: newTitle.trim(),
                content: newContent.trim(),
                imageUrl: newImageUrl ? newImageUrl.trim() : null,
                shopName,
                shopLogoUrl,
                authorRole: isSuperAdmin ? "super_admin" : "admin",
                authorEmail: user?.email || "Admin",
            });

            showToast("สร้างประกาศใหม่สำเร็จ แสดงบนหน้า Feed ทันที", "success");
            setIsCreateOpen(false);
            setNewTitle("");
            setNewContent("");
            setNewImageUrl("");
            setSelectedShopId("system");
            await load();
        } catch (err) {
            console.error("createFeedPost error:", err);
            showToast("สร้างประกาศไม่สำเร็จ: " + (err.message || "กรุณาลองใหม่"), "error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <AdminNav />
            <div style={{ maxWidth: 840, margin: "32px auto", padding: "0 16px" }}>
                <Breadcrumb items={[{ label: "ภาพรวม", to: "/admin" }, { label: "ประกาศข่าวสาร" }]} />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 20,
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: "clamp(22px, 3.5vw, 26px)",
                                fontWeight: 700,
                                margin: "0 0 6px 0",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            ประกาศข่าวสารทั้งหมด ({posts.length})
                        </h1>
                        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                            ประกาศขึ้นหน้า Feed สาธารณะทันที — แอดมินสามารถสร้างข่าวสารใหม่ ตรวจสอบย้อนหลัง หรือซ่อนโพสต์ได้
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-primary)",
                            color: "#fff",
                            border: "none",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            minHeight: 40,
                        }}
                    >
                        <Icon name="plus" size={16} />
                        สร้างประกาศใหม่
                    </button>
                </div>

                {loading ? (
                    <PageSkeleton lines={4} />
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--color-text-muted)" }}>
                        <Icon name="newspaper" size={36} color="var(--color-text-muted)" />
                        <p style={{ marginTop: 10, fontSize: 14 }}>ยังไม่มีประกาศในระบบ</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="card"
                                style={{
                                    padding: 16,
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg-surface)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, minWidth: 240 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                            <strong style={{ fontSize: 16 }}>{post.title}</strong>
                                            {post.shopName && (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--color-primary)",
                                                        background: "var(--color-bg-subtle)",
                                                        border: "1px solid var(--color-border)",
                                                        padding: "2px 8px",
                                                        borderRadius: "var(--radius-sm)",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {post.shopName}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: "6px 0", fontSize: 13, color: "var(--color-text-muted)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                            {post.content}
                                        </p>
                                    </div>
                                    <span
                                        className={`status-badge status-badge--${post.status === "approved" ? "approved" : "rejected"}`}
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        {post.status === "approved" ? "แสดงอยู่" : "ถูกซ่อน"}
                                    </span>
                                </div>

                                {post.imageUrl && (
                                    <img
                                        src={post.imageUrl}
                                        alt={post.title}
                                        style={{
                                            maxWidth: 200,
                                            maxHeight: 140,
                                            objectFit: "cover",
                                            borderRadius: "var(--radius-sm)",
                                            marginTop: 10,
                                            border: "1px solid var(--color-border)",
                                            display: "block",
                                        }}
                                    />
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString("th-TH", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }) : "เพิ่งสร้าง"}
                                    </span>

                                    <div>
                                        {post.status === "approved" ? (
                                            <button
                                                type="button"
                                                disabled={busyId === post.id}
                                                onClick={() => setConfirmAction({ type: "hide", postId: post.id })}
                                                style={{
                                                    fontSize: 12,
                                                    padding: "4px 10px",
                                                    borderRadius: "var(--radius-sm)",
                                                    background: "var(--color-status-rejected-bg)",
                                                    color: "var(--color-danger)",
                                                    border: "1px solid var(--color-danger)",
                                                    cursor: "pointer",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                ซ่อนโพสต์นี้
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={busyId === post.id}
                                                onClick={() => setConfirmAction({ type: "unhide", postId: post.id })}
                                                style={{
                                                    fontSize: 12,
                                                    padding: "4px 10px",
                                                    borderRadius: "var(--radius-sm)",
                                                    background: "var(--color-status-approved-bg)",
                                                    color: "var(--color-success)",
                                                    border: "1px solid var(--color-success)",
                                                    cursor: "pointer",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                ยกเลิกซ่อน
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal สร้างประกาศใหม่สำหรับ Admin */}
            {isCreateOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: 16,
                    }}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: 500,
                            width: "100%",
                            padding: 24,
                            borderRadius: "var(--radius-md)",
                            background: "var(--color-bg-surface)",
                            border: "1px solid var(--color-border)",
                            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>สร้างประกาศข่าวสารใหม่</h3>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                    เผยแพร่ในนาม
                                </label>
                                <select
                                    value={selectedShopId}
                                    onChange={(e) => setSelectedShopId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 10px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        fontSize: 13,
                                        color: "var(--color-text)",
                                    }}
                                >
                                    <option value="system">📢 แพลตฟอร์ม Rittiya Shop (ส่วนกลาง)</option>
                                    {shops.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            🏪 ร้าน: {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                    หัวข้อประกาศ <span style={{ color: "var(--color-danger)" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="เช่น แจ้งปิดปรับปรุงระบบ หรือ โปรโมชั่นวันหยุด"
                                    maxLength={200}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "8px 10px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        fontSize: 13,
                                        color: "var(--color-text)",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                    เนื้อหาประกาศ <span style={{ color: "var(--color-danger)" }}>*</span>
                                </label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    rows={4}
                                    placeholder="รายละเอียดประกาศ..."
                                    maxLength={5000}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "8px 10px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        fontSize: 13,
                                        color: "var(--color-text)",
                                        boxSizing: "border-box",
                                        fontFamily: "inherit",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <ImageUploadField
                                    value={newImageUrl}
                                    onChange={setNewImageUrl}
                                    label="รูปภาพประกอบ (ไม่บังคับ)"
                                />
                            </div>

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={submitting}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        background: "var(--color-bg-surface)",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        padding: "8px 18px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "none",
                                        background: "var(--color-primary)",
                                        color: "#fff",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: submitting ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {submitting ? "กำลังเผยแพร่..." : "เผยแพร่ประกาศ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmAction && (
                <ConfirmModal
                    message={
                        confirmAction.type === "hide"
                            ? "ซ่อนประกาศนี้ออกจากหน้า Feed สาธารณะ?"
                            : "ยกเลิกซ่อนประกาศนี้? โพสต์จะกลับไปแสดงใน Feed สาธารณะ"
                    }
                    onConfirm={handleConfirmed}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </div>
    );
}
