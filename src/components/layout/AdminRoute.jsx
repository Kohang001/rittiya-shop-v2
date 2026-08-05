import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageSkeleton from "../ui/PageSkeleton";

/**
 * ครอบหน้า Admin ทั้งหมด — เช็ค custom claim "admin" เท่านั้น (ไม่ใช่แค่ login ธรรมดา)
 * ถ้าไม่ใช่ admin → เด้งไปหน้าแรก (ไม่ใช่หน้า admin login เพราะไม่อยากบอกใบ้ว่ามีหน้า admin อยู่)
 */
export default function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return <PageSkeleton lines={4} />;
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}