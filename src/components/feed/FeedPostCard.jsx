// src/components/feed/FeedPostCard.jsx
import { Link } from "react-router-dom";

export default function FeedPostCard({ post }) {
    return (
        <Link
            to={`/shop/${post.shopId}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
            <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s" }}
                 onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
                 onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
                {post.imageUrl && (
                    <img
                        src={post.imageUrl}
                        alt={post.title}
                        style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover" }}
                    />
                )}
                <div style={{ padding: 14 }}>
                    {/* ชื่อร้าน + โลโก้ */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        {post.shopLogoUrl ? (
                            <img
                                src={post.shopLogoUrl}
                                alt={post.shopName}
                                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{
                                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                background: "var(--color-bg-subtle, #f1f5f9)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, color: "var(--color-text-muted, #94a3b8)"
                            }}>
                                🏪
                            </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary, #6366f1)" }}>
                            {post.shopName || "ร้านค้า"}
                        </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px 0" }}>{post.title}</h3>
                    <p style={{ margin: 0, fontSize: 14, color: "#555", whiteSpace: "pre-wrap" }}>
                        {post.content}
                    </p>
                </div>
            </div>
        </Link>
    );
}