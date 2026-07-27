// src/components/ui/Skeleton.jsx
// แท่ง/กล่องเทาสำหรับสร้าง Skeleton Screen — ใช้ประกอบเป็นรูปทรงเดียวกับเนื้อหาจริง
export default function Skeleton({ width = "100%", height = 16, radius = 6, style }) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius: radius,
                background:
                    "linear-gradient(90deg, var(--color-bg-subtle) 25%, #eef1f4 37%, var(--color-bg-subtle) 63%)",
                backgroundSize: "400% 100%",
                animation: "skeleton-shimmer 1.4s ease infinite",
                ...style,
            }}
        />
    );
}