import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageSkeleton from "../ui/PageSkeleton";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <PageSkeleton lines={4} />;
    }

    if (!user) {
        return <Navigate to="/seller/login" replace />;
    }

    return children;
}