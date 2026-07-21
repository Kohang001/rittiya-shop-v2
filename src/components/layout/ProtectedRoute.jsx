import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
    }

    if (!user) {
        return <Navigate to="/seller/login" replace />;
    }

    return children;
}