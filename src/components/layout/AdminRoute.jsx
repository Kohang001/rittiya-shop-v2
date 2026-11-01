// src/components/layout/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageSkeleton from "../ui/PageSkeleton";

/**
 * ครอบหน้า Admin ทั้งหมด — เช็คทั้ง custom claim "admin" และ Firestore admins/{uid}
 * ป้องกันปัญหา Token Cache ดีเลย์ เมื่อเพิ่งได้รับการแต่งตั้งสิทธิ์
 */
export default function AdminRoute({ children }) {
    const { user, isAdmin, checkAdminStatus, loading } = useAuth();
    const [verifying, setVerifying] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function verify() {
            if (user && !isAdmin && !checked) {
                setVerifying(true);
                await checkAdminStatus();
                if (isMounted) {
                    setChecked(true);
                    setVerifying(false);
                }
            } else if (!user || isAdmin) {
                setChecked(true);
            }
        }
        verify();
        return () => {
            isMounted = false;
        };
    }, [user, isAdmin, checkAdminStatus, checked]);

    if (loading || verifying || (user && !isAdmin && !checked)) {
        return (
            <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
                <PageSkeleton lines={5} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
