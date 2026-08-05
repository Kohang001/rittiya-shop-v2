// src/pages/public/FeedPage.jsx
import { useEffect, useState } from "react";
import { getApprovedFeedPosts, getShopsByOwner, deleteFeedPost } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import FeedPostCard from "../../components/feed/FeedPostCard";

export default function FeedPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myShopIds, setMyShopIds] = useState([]);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        getApprovedFeedPosts()
            .then(setPosts)
            .catch((err) => console.error("โหลดประกาศไม่สำเร็จ:", err))
            .finally(() => setLoading(false));
    }, []);

    // ดึง shopId ของ user ที่ login อยู่ เพื่อเช็คว่าเป็นเจ้าของโพสต์ไหม
    useEffect(() => {
        if (!user) return;
        getShopsByOwner(user.uid)
            .then((shops) => setMyShopIds(shops.map((s) => s.id)))
            .catch(() => {});
    }, [user]);

    async function handleDelete(postId) {
        if (!confirm("ต้องการลบประกาศนี้? ลบแล้วไม่สามารถกู้คืนได้")) return;
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

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;

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
                                onDelete={isMyPost ? handleDelete : undefined}
                                deleting={deletingId === post.id}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}