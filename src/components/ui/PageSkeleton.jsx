// src/components/ui/PageSkeleton.jsx
// Skeleton ทั่วไปสำหรับหน้าที่กำลังโหลดข้อมูล — ใช้แทน "กำลังโหลด..."
import Skeleton from "./Skeleton";

export default function PageSkeleton({ lines = 5 }) {
    return (
        <div className="page-skeleton">
            <Skeleton width="50%" height={24} />
            <Skeleton width="100%" height={14} />
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} width={`${70 + Math.random() * 30}%`} height={14} />
            ))}
            <Skeleton width="100%" height={48} radius={10} style={{ marginTop: 8 }} />
            <Skeleton width="100%" height={48} radius={10} />
        </div>
    );
}
