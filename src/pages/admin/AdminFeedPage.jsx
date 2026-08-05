// src/pages/admin/AdminFeedPage.jsx
import { useEffect, useState } from "react";
import { getAllFeedPostsForAdmin, hideFeedPost, unhideFeedPost } from "../../firebase/firestore";
import { useToast } from "../../context/ToastContext";
import AdminNav from "../../components/layout/AdminNav";
import ConfirmModal from "../../components/ui/ConfirmModal";
import PageSkeleton from "../../components/ui/PageSkeleton";

export default function AdminFeedPage() {
    const { showToast } = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { type: "hide"|"unhide", postId }

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        const data = await getAllFeedPostsForAdmin();
        setPosts(data);
        setLoading(false);
    }

    async function handleConfirmed() {
        const { type, postId } = confirmAction;
        setConfirmAction(null);
        setBusyId(postId);
        try {
            if (type === "hide") {
                await hideFeedPost(postId);
                showToast("ซ่อนประกาศแล้ว", "success");
            } else {
                await unhideFeedPost(postId);
                showToast("ยกเลิกซ่อนแล้ว — โพสต์กลับมาแสดงใน Feed", "success");
            }
            await load();
        } catch (err) {
            showToast(type === "hide" ? "ซ่อนประกาศไม่สำเร็จ" : "ยกเลิกซ่อนไม่สำเร็จ", "error");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div>
            <AdminNav />
            <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
                <h2>ประกาศทั้งหมด</h2>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
                    ประกาศขึ้นหน้า Feed ทันทีที่สร้างโดยไม่ต้องรออนุมัติ — หน้านี้ใช้ตรวจสอบย้อนหลังและซ่อน/ยกเลิกซ่อนโพสต์
                </p>

                {loading ? (
                    <PageSkeleton lines={4} />
                ) : posts.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)" }}>ยังไม่มีประกาศ</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {posts.map((post) => (
                            <div key={post.id} className="card" style={{ padding: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <div>
                                        <strong>{post.title}</strong>
                                        {post.shopName && (
                                            <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginLeft: 8 }}>
                                                โดย {post.shopName}
                                            </span>
                                        )}
                                        <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-text-muted)", whiteSpace: "pre-wrap" }}>
                                            {post.content}
                                        </p>
                                    </div>
                                    <span
                                        className={`status-badge status-badge--${post.status === "approved" ? "approved" : "rejected"}`}
                                    >
                                        {post.status === "approved" ? "แสดงอยู่" : "ถูกซ่อน"}
                                    </span>
                                </div>
                                {post.imageUrl && (
                                    <img
                                        src={post.imageUrl}
                                        alt={post.title}
                                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 8 }}
                                    />
                                )}
                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                    {post.status === "approved" ? (
                                        <button
                                            disabled={busyId === post.id}
                                            onClick={() => setConfirmAction({ type: "hide", postId: post.id })}
                                        >
                                            ซ่อนโพสต์นี้
                                        </button>
                                    ) : (
                                        <button
                                            disabled={busyId === post.id}
                                            onClick={() => setConfirmAction({ type: "unhide", postId: post.id })}
                                        >
                                            ยกเลิกซ่อน
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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