// src/components/shop/ShopCardSkeleton.jsx
// รูปทรงต้องตรงกับ ShopCard.jsx เป๊ะ เพื่อไม่ให้เกิด Layout Shift ตอนข้อมูลจริงโหลดเสร็จ
import Skeleton from "../ui/Skeleton";

export default function ShopCardSkeleton() {
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ width: "100%", aspectRatio: "1 / 1" }}>
                <Skeleton width="100%" height="100%" radius={0} />
            </div>
            <div style={{ padding: 12 }}>
                <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="90%" height={13} style={{ marginBottom: 10 }} />
                <Skeleton width={60} height={18} radius={999} />
            </div>
        </div>
    );
}