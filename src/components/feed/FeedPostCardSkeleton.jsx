// src/components/feed/FeedPostCardSkeleton.jsx
import Skeleton from "../ui/Skeleton";

export default function FeedPostCardSkeleton() {
    return (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
            <Skeleton width="100%" height={180} radius={0} />
            <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Skeleton width={28} height={28} radius={999} />
                    <Skeleton width={80} height={13} />
                </div>
                <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
                <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="75%" height={14} />
            </div>
        </div>
    );
}
