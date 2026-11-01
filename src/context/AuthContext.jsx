// src/context/AuthContext.jsx — With Super Admin, Normal Admin & User Profile Auto-fill Support
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { watchAuthState } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";
import { db } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminRole, setAdminRole] = useState(null); // 'super' | 'normal' | null
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isNormalAdmin, setIsNormalAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAdminStatus = useCallback(async (forcedUser) => {
        const target = forcedUser || user;
        if (!target) return false;
        try {
            // 1. ลอง Force refresh token จาก Firebase Auth
            const tokenResult = await target.getIdTokenResult(true);
            if (tokenResult.claims.admin === true) {
                const role = tokenResult.claims.adminRole || "super";
                setIsAdmin(true);
                setAdminRole(role);
                setIsSuperAdmin(role === "super");
                setIsNormalAdmin(role === "normal");
                return true;
            }
            // 2. ตรวจสอบจาก Firestore admins/{uid} โดยตรง
            const adminDocSnap = await getDoc(doc(db, "admins", target.uid));
            if (adminDocSnap.exists()) {
                const adminData = adminDocSnap.data();
                if (adminData.role === "super" || adminData.role === "normal") {
                    setIsAdmin(true);
                    setAdminRole(adminData.role);
                    setIsSuperAdmin(adminData.role === "super");
                    setIsNormalAdmin(adminData.role === "normal");
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    }, [user]);

    const refreshUserProfile = useCallback(async (uid) => {
        const targetUid = uid || user?.uid;
        if (!targetUid) {
            setUserProfile(null);
            return null;
        }
        try {
            const profile = await getUserProfile(targetUid);
            setUserProfile(profile);
            return profile;
        } catch (err) {
            console.warn("Failed to load user profile:", err);
            return null;
        }
    }, [user?.uid]);

    useEffect(() => {
        // onAuthStateChanged ทำงานทุกครั้งที่สถานะ login เปลี่ยน (login/logout/refresh หน้า)
        const unsubscribe = watchAuthState(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // ดึงข้อมูลโปรไฟล์ผู้ใช้ทั่วไป (ชื่อ, เบอร์, สถานที่นัดรับ)
                refreshUserProfile(firebaseUser.uid);

                // ดึง custom claim จาก ID token เพื่อเช็คระดับขั้น Admin
                let tokenResult = await firebaseUser.getIdTokenResult();
                let hasAdminClaim = tokenResult.claims.admin === true;
                let role = tokenResult.claims.adminRole || (hasAdminClaim ? "super" : null);

                // ตรวจสอบเอกสาร Firestore admins/{uid} เผื่อ token claim ยังไม่ได้ refresh ทันที
                if (!hasAdminClaim) {
                    try {
                        const adminDocSnap = await getDoc(doc(db, "admins", firebaseUser.uid));
                        if (adminDocSnap.exists()) {
                            const adminData = adminDocSnap.data();
                            if (adminData.role === "super" || adminData.role === "normal") {
                                hasAdminClaim = true;
                                role = adminData.role;
                                // Force refresh token ในเบื้องหลังเพื่อให้ได้ claims ล่าสุด
                                firebaseUser.getIdTokenResult(true).then((refreshed) => {
                                    if (refreshed.claims.admin === true) {
                                        setAdminRole(refreshed.claims.adminRole || role);
                                    }
                                }).catch(() => {});
                            }
                        }
                    } catch (err) {
                        console.warn("Check admins collection error:", err);
                    }
                }

                setIsAdmin(hasAdminClaim);
                setAdminRole(role);
                setIsSuperAdmin(hasAdminClaim && role === "super");
                setIsNormalAdmin(hasAdminClaim && role === "normal");
            } else {
                setUser(null);
                setUserProfile(null);
                setIsAdmin(false);
                setAdminRole(null);
                setIsSuperAdmin(false);
                setIsNormalAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [refreshUserProfile]);

    const value = {
        user,
        userProfile,
        refreshUserProfile,
        checkAdminStatus,
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
