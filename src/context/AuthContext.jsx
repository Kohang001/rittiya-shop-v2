// src/context/AuthContext.jsx — With Real-Time Role Grant & Revocation Support
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { watchAuthState } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";
import { db } from "../firebase/config";

const MASTER_ADMIN_EMAIL = "nathwrrthsumphlxy@gmail.com";

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
            const isMaster = target.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

            // Single Source of Truth: ตรวจสอบจาก Firestore admins/{uid} โดยตรง
            const adminDocSnap = await getDoc(doc(db, "admins", target.uid));
            if (adminDocSnap.exists()) {
                const adminData = adminDocSnap.data();
                if (adminData.role === "super" || adminData.role === "normal") {
                    setIsAdmin(true);
                    setAdminRole(adminData.role);
                    setIsSuperAdmin(adminData.role === "super" || isMaster);
                    setIsNormalAdmin(adminData.role === "normal" && !isMaster);
                    target.getIdTokenResult(true).catch(() => {});
                    return true;
                }
            }

            if (isMaster) {
                setIsAdmin(true);
                setAdminRole("super");
                setIsSuperAdmin(true);
                setIsNormalAdmin(false);
                return true;
            }

            // ถ้าไม่มีเอกสารใน admins/{uid} และไม่ใช่ Master -> ปลดสิทธิ์ทันที
            setIsAdmin(false);
            setAdminRole(null);
            setIsSuperAdmin(false);
            setIsNormalAdmin(false);
            target.getIdTokenResult(true).catch(() => {});
            return false;
        } catch (err) {
            console.warn("checkAdminStatus error:", err);
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
        let adminUnsub = null;

        // onAuthStateChanged ทำงานทุกครั้งที่สถานะ login เปลี่ยน (login/logout/refresh หน้า)
        const authUnsub = watchAuthState(async (firebaseUser) => {
            if (adminUnsub) {
                adminUnsub();
                adminUnsub = null;
            }

            if (firebaseUser) {
                setUser(firebaseUser);

                // ดึงข้อมูลโปรไฟล์ผู้ใช้ทั่วไป (ชื่อ, เบอร์, สถานที่นัดรับ)
                refreshUserProfile(firebaseUser.uid);

                const isMaster = firebaseUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

                // ติดตั้ง Real-Time Listener กับเอกสาร admins/{uid} ใน Firestore
                // ช่วยให้การให้สิทธิ์ หรือการปลดสิทธิ์ Admin เกิดขึ้นทันทีใน < 1 วินาที (เกือบ Real-Time)
                adminUnsub = onSnapshot(
                    doc(db, "admins", firebaseUser.uid),
                    (docSnap) => {
                        if (docSnap.exists() && (docSnap.data().role === "super" || docSnap.data().role === "normal")) {
                            const role = docSnap.data().role;
                            setIsAdmin(true);
                            setAdminRole(role);
                            setIsSuperAdmin(role === "super" || isMaster);
                            setIsNormalAdmin(role === "normal" && !isMaster);
                            // Refresh Token เบื้องหลังเพื่อให้ claims ซิงค์กัน
                            firebaseUser.getIdTokenResult(true).catch(() => {});
                        } else if (isMaster) {
                            // Master Super Admin หลักมีสิทธิ์ตลอดกาล
                            setIsAdmin(true);
                            setAdminRole("super");
                            setIsSuperAdmin(true);
                            setIsNormalAdmin(false);
                        } else {
                            // ปลดสิทธิ์ทันทีแบบ Real-Time เมื่อเอกสารถูกลบใน Firestore
                            setIsAdmin(false);
                            setAdminRole(null);
                            setIsSuperAdmin(false);
                            setIsNormalAdmin(false);
                            // สั่ง Force refresh Token ทันทีเพื่อล้าง custom claims ที่แคชอยู่ในเบราว์เซอร์
                            firebaseUser.getIdTokenResult(true).catch(() => {});
                        }
                        setLoading(false);
                    },
                    (err) => {
                        console.warn("Real-time admin listener error:", err);
                        if (isMaster) {
                            setIsAdmin(true);
                            setAdminRole("super");
                            setIsSuperAdmin(true);
                            setIsNormalAdmin(false);
                        } else {
                            setIsAdmin(false);
                            setAdminRole(null);
                            setIsSuperAdmin(false);
                            setIsNormalAdmin(false);
                        }
                        setLoading(false);
                    }
                );
            } else {
                setUser(null);
                setUserProfile(null);
                setIsAdmin(false);
                setAdminRole(null);
                setIsSuperAdmin(false);
                setIsNormalAdmin(false);
                setLoading(false);
            }
        });

        return () => {
            authUnsub();
            if (adminUnsub) adminUnsub();
        };
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
