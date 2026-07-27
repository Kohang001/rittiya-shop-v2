// src/components/shop/ProductCardSkeleton.jsx
import Skeleton from "../ui/Skeleton";

export default function ProductCardSkeleton() {
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ width: "100%", aspectRatio: "1 / 1" }}>
                <Skeleton width="100%" height="100%" radius={0} />
            </div>
            <div style={{ padding: 10 }}>
                <Skeleton width="80%" height={14} style={{ marginBottom: 6 }} />
                <Skeleton width="100%" height={12} style={{ marginBottom: 10 }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Skeleton width={50} height={16} />
                    <Skeleton width={70} height={28} radius={6} />
                </div>
            </div>
        </div>
    );
}