// src/components/feed/FeedPostCard.jsx
import { Link } from "react-router-dom";

export default function FeedPostCard({ post, onDelete, deleting }) {
    return (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", transition: "box-shadow 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
        >
            <Link
                to={`/shop/${post.shopId}`}
                style={{ textDecoration: "none", color: "inherit", display: "block", cursor: "pointer" }}
            >
                {post.imageUrl && (
                    <img
                        src={post.imageUrl}
                        alt={post.title}
                        style={{ width: "100%", display: "block" }}
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
                                ร้าน:
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
            </Link>

            {onDelete && (
                <div style={{ padding: "0 14px 14px" }}>
                    <button
                        onClick={() => onDelete(post.id)}
                        disabled={deleting}
                        style={{
                            fontSize: 12,
                            color: "var(--color-danger, #ef4444)",
                            background: "none",
                            border: "1px solid var(--color-danger, #ef4444)",
                            borderRadius: "var(--radius-sm, 6px)",
                            padding: "4px 12px",
                            cursor: "pointer",
                        }}
                    >
                        {deleting ? "กำลังลบ..." : "ลบโพสต์นี้"}
                    </button>
                </div>
            )}
        </div>
    );
}