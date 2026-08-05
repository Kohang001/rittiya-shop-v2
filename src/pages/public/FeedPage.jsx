// src/pages/public/FeedPage.jsx
import { useEffect, useState } from "react";
import { getApprovedFeedPosts, getShopsByOwner, deleteFeedPost } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import FeedPostCard from "../../components/feed/FeedPostCard";
import FeedPostCardSkeleton from "../../components/feed/FeedPostCardSkeleton";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function FeedPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myShopIds, setMyShopIds] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        getApprovedFeedPosts()
            .then(setPosts)
            .catch((err) => console.error("โหลดประกาศไม่สำเร็จ:", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!user) return;
        getShopsByOwner(user.uid)
            .then((shops) => setMyShopIds(shops.map((s) => s.id)))
            .catch(() => {});
    }, [user]);

    async function handleDeleteConfirmed() {
        const postId = confirmDeleteId;
        setConfirmDeleteId(null);
        setDeletingId(postId);
        try {
            await deleteFeedPost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            showToast("ลบประกาศแล้ว", "success");
        } catch (err) {
            console.error("ลบประกาศไม่สำเร็จ:", err);
            showToast("ลบประกาศไม่สำเร็จ", "error");
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
                <h1>ประกาศจากร้านค้า</h1>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <FeedPostCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
            <h1>ประกาศจากร้านค้า</h1>
            {posts.length === 0 ? (
                <p style={{ color: "#888" }}>ยังไม่มีประกาศ</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {posts.map((post) => {
                        const isMyPost = myShopIds.includes(post.shopId);
                        return (
                            <FeedPostCard
                                key={post.id}
                                post={post}
                                onDelete={isMyPost ? (id) => setConfirmDeleteId(id) : undefined}
                                deleting={deletingId === post.id}
                            />
                        );
                    })}
                </div>
            )}

            {confirmDeleteId && (
                <ConfirmModal
                    message="ต้องการลบประกาศนี้? ลบแล้วไม่สามารถกู้คืนได้"
                    onConfirm={handleDeleteConfirmed}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}