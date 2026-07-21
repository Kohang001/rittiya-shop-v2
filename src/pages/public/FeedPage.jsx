// src/pages/public/FeedPage.jsx
import { useEffect, useState } from "react";
import { getApprovedFeedPosts } from "../../firebase/firestore";
import FeedPostCard from "../../components/feed/FeedPostCard";

export default function FeedPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getApprovedFeedPosts()
            .then(setPosts)
            .catch((err) => console.error("โหลดประกาศไม่สำเร็จ:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
            <h1>ประกาศจากร้านค้า</h1>
            {posts.length === 0 ? (
                <p style={{ color: "#888" }}>ยังไม่มีประกาศ</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {posts.map((post) => (
                        <FeedPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}