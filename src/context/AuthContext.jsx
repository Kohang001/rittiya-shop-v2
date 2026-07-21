// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { watchAuthState } from "../firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChanged ทำงานทุกครั้งที่สถานะ login เปลี่ยน (login/logout/refresh หน้า)
        const unsubscribe = watchAuthState(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // ดึง custom claim จาก ID token เพื่อเช็คว่าเป็น admin ไหม
                // (claim นี้จะถูกตั้งผ่าน /api/setAdminClaim เท่านั้น ไม่มีทางตั้งเองจาก client)
                const tokenResult = await firebaseUser.getIdTokenResult();
                setIsAdmin(tokenResult.claims.admin === true);
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = { user, isAdmin, loading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth ต้องถูกเรียกใช้ภายใน <AuthProvider> เท่านั้น");
    }
    return context;
}