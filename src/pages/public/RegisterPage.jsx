// src/pages/public/RegisterPage.jsx
// ระบบสมัครสมาชิกทั่วไป (สำหรับผู้ซื้อ) เพื่อเก็บข้อมูลชื่อ เบอร์ติดต่อ และสถานที่นัดรับอัตโนมัติ
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { registerUser } from "../../firebase/auth";
import { saveUserProfile } from "../../firebase/firestore";
import { validatePhone } from "../../utils/validators";
import PasswordInput from "../../components/ui/PasswordInput";
import Icon from "../../components/ui/Icon";

export default function RegisterPage() {
    const { refreshUserProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [defaultPickupLocation, setDefaultPickupLocation] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        // 1. ตรวจสอบข้อมูลเบื้องต้น
        if (!displayName.trim()) {
            setError("กรุณากรอกชื่อของคุณ");
            return;
        }

        const phoneClean = phone.trim().replace(/-/g, "");
        const phoneCheck = validatePhone(phoneClean);
        if (!phoneCheck.valid) {
            setError(phoneCheck.error || "กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง");
            return;
        }

        if (password.length < 6) {
            setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
            return;
        }

        if (password !== confirmPassword) {
            setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
            return;
        }

        setLoading(true);

        try {
            // 2. สมัครบัญชีใน Firebase Authentication
            const { user, error: authError } = await registerUser(email.trim(), password);

            if (authError || !user) {
                setError(authError || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
                setLoading(false);
                return;
            }

            // 3. บันทึกข้อมูลโปรไฟล์ลงใน Firestore คอลเลกชัน users/{uid}
            await saveUserProfile(user.uid, {
                displayName: displayName.trim(),
                phone: phoneClean,
                defaultPickupLocation: defaultPickupLocation.trim(),
                email: email.trim(),
                role: "user",
            });

            // 4. รีเฟรชข้อมูลโปรไฟล์ใน State
            await refreshUserProfile(user.uid);

            showToast("สมัครสมาชิกสำเร็จ ยินดีต้อนรับ!", "success");
            navigate("/");
        } catch (err) {
            console.error("RegisterPage error:", err);
            setError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 460, margin: "40px auto", padding: "0 16px" }}>
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
                    <h2 style={{ fontSize: 22, margin: "0 0 6px 0", letterSpacing: "-0.01em" }}>
                        สมัครสมาชิกทั่วไป (ผู้ซื้อ)
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                        บันทึกชื่อ เบอร์ติดต่อ และสถานที่นัดรับประจำ เพื่อสั่งซื้อสะดวกรวดเร็วโดยไม่ต้องกรอกซ้ำ
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ข้อมูลโปรไฟล์สำหรับกรอกออเดอร์อัตโนมัติ */}
                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="reg-name" style={{ fontWeight: 600 }}>
                            ชื่อ-นามสกุล / ชื่อเล่นสำหรับสั่งสินค้า <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <input
                            id="reg-name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="เช่น สมชาย ใจดี (น้องมินต์ ม.5/2)"
                            style={{ display: "block", width: "100%" }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="reg-phone" style={{ fontWeight: 600 }}>
                            เบอร์โทรศัพท์ติดต่อ (10 หลัก) <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <input
                            id="reg-phone"
                            type="tel"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="เช่น 0812345678"
                            style={{ display: "block", width: "100%" }}
                            required
                        />
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2, display: "block" }}>
                            ใส่เฉพาะตัวเลข 10 หลัก สำหรับให้แม่ค้าติดต่อเวลานัดรับสินค้า
                        </span>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="reg-pickup" style={{ fontWeight: 600 }}>
                            สถานที่นัดรับประจำ (ไม่บังคับ)
                        </label>
                        <input
                            id="reg-pickup"
                            type="text"
                            value={defaultPickupLocation}
                            onChange={(e) => setDefaultPickupLocation(e.target.value)}
                            placeholder="เช่น หน้าตึก 3 ชั้น 1, โรงอาหารโต๊ะ 12, ห้อง ม.5/2"
                            style={{ display: "block", width: "100%" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2, display: "block" }}>
                            ระบบจะกรอกสถานที่นี้ให้อัตโนมัติเวลาสั่งซื้อ (คุณสามารถเปลี่ยนได้ทุกครั้งที่สั่ง)
                        </span>
                    </div>

                    <hr style={{ borderColor: "var(--color-border)", margin: "18px 0" }} />

                    {/* ข้อมูลบัญชีผู้ใช้ */}
                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="reg-email" style={{ fontWeight: 600 }}>
                            อีเมล <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <input
                            id="reg-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            style={{ display: "block", width: "100%" }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="reg-password" style={{ fontWeight: 600 }}>
                            รหัสผ่าน <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <PasswordInput
                            id="reg-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="อย่างน้อย 6 ตัวอักษร"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label htmlFor="reg-confirm-password" style={{ fontWeight: 600 }}>
                            ยืนยันรหัสผ่าน <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <PasswordInput
                            id="reg-confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
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
                        {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)", fontSize: 13, color: "var(--color-text-muted)" }}>
                    <div style={{ marginBottom: 8 }}>
                        มีบัญชีอยู่แล้ว? <Link to="/login" style={{ fontWeight: 600 }}>เข้าสู่ระบบ</Link>
                    </div>
                    <div>
                        ต้องการขายของในโรงเรียน? <Link to="/seller/register" style={{ fontWeight: 600 }}>สมัครเปิดร้านค้า</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
