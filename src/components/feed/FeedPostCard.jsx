// src/components/feed/FeedPostCard.jsx
export default function FeedPostCard({ post }) {
    return (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
            {post.imageUrl && (
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover" }}
                />
            )}
            <div style={{ padding: 14 }}>
                <h3 style={{ margin: "0 0 6px 0" }}>{post.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#555", whiteSpace: "pre-wrap" }}>
                    {post.content}
                </p>
            </div>
        </div>
    );
}