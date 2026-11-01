// src/pages/public/LoginPage.jsx
// หน้าเข้าสู่ระบบหลักสำหรับผู้ใช้ทั่วไปและร้านค้า
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PasswordInput from "../../components/ui/PasswordInput";
import Icon from "../../components/ui/Icon";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { refreshUserProfile, checkAdminStatus } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { user, error: authError } = await loginUser(email.trim(), password);

        if (authError || !user) {
            setLoading(false);
            setError(authError || "เข้าสู่ระบบไม่สำเร็จ");
            return;
        }

        try {
            await refreshUserProfile(user.uid);
            const isUserAdmin = await checkAdminStatus(user);
            showToast("เข้าสู่ระบบสำเร็จ", "success");
            if (isUserAdmin) {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch {
            navigate("/");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
            <div
                className="card"
                style={{
                    padding: 24,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-surface)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            background: "rgba(13, 148, 136, 0.1)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 10,
                        }}
                    >
                        <Icon name="user" size={24} color="var(--color-primary)" />
                    </div>
                    <h2 style={{ fontSize: 22, margin: "0 0 6px 0", letterSpacing: "-0.01em" }}>เข้าสู่ระบบ</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                        เข้าใช้งานเพื่อจัดการร้านค้า หรือสั่งซื้อสินค้าแบบกรอกข้อมูลอัตโนมัติ
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="login-email" style={{ fontWeight: 600 }}>อีเมล</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            style={{ display: "block", width: "100%" }}
                            required
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="login-password" style={{ fontWeight: 600 }}>รหัสผ่าน</label>
                        <PasswordInput
                            id="login-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="กรอกรหัสผ่านของคุณ"
                            required
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            style={{
                                color: "var(--color-danger)",
                                background: "var(--color-status-rejected-bg)",
                                border: "1px solid rgba(220, 38, 38, 0.2)",
                                padding: "8px 12px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: 13,
                                marginBottom: 16,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            minHeight: 44,
                            justifyContent: "center",
                            background: "var(--color-primary)",
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 600,
                            borderRadius: "var(--radius-sm)",
                        }}
                    >
                        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)", fontSize: 13, color: "var(--color-text-muted)" }}>
                    <div style={{ marginBottom: 8 }}>
                        ยังไม่มีบัญชี? <Link to="/register" style={{ fontWeight: 600 }}>สมัครสมาชิกทั่วไป (ผู้ซื้อ)</Link>
                    </div>
                    <div>
                        ต้องการเปิดร้านขายของ? <Link to="/seller/register" style={{ fontWeight: 600 }}>สมัครเปิดร้านค้า</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
