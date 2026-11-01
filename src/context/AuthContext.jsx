// src/context/AuthContext.jsx — With Super Admin & Normal Admin RBAC Support
import { createContext, useContext, useEffect, useState } from "react";
import { watchAuthState } from "../firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminRole, setAdminRole] = useState(null); // 'super' | 'normal' | null
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isNormalAdmin, setIsNormalAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChanged ทำงานทุกครั้งที่สถานะ login เปลี่ยน (login/logout/refresh หน้า)
        const unsubscribe = watchAuthState(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // ดึง custom claim จาก ID token เพื่อเช็คระดับขั้น Admin
                const tokenResult = await firebaseUser.getIdTokenResult();
                const hasAdminClaim = tokenResult.claims.admin === true;

                // หากเป็นแอดมินแต่ยังไม่มี claim adminRole (บัญชีเดิม) ให้ถือเป็น 'super' โดยปริยาย (Backward Compatible)
                const role = tokenResult.claims.adminRole || (hasAdminClaim ? "super" : null);

                setIsAdmin(hasAdminClaim);
                setAdminRole(role);
                setIsSuperAdmin(hasAdminClaim && role === "super");
                setIsNormalAdmin(hasAdminClaim && role === "normal");
            } else {
                setUser(null);
                setIsAdmin(false);
                setAdminRole(null);
                setIsSuperAdmin(false);
                setIsNormalAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        isAdmin,
        adminRole,
        isSuperAdmin,
        isNormalAdmin,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth ต้องถูกเรียกใช้ภายใน <AuthProvider> เท่านั้น");
    }
    return context;
}
