// src/pages/seller/SellerLoginPage.jsx — อัปเดตหลัง UX Audit: label ผูก id/htmlFor + password toggle
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../firebase/auth";
import PasswordInput from "../../components/ui/PasswordInput";

export default function SellerLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error: authError } = await loginUser(email, password);
        setLoading(false);

        if (authError) {
            setError(authError);
            return;
        }

        navigate("/seller/dashboard");
    }

    return (
        <div style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
            <h2>เข้าสู่ระบบร้านค้า</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="login-email">อีเมล</label>
                <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                    required
                />

                <label htmlFor="login-password">รหัสผ่าน</label>
                <div style={{ marginBottom: 10 }}>
                    <PasswordInput
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <p
                        role="alert"
                        style={{
                            color: "var(--color-danger)",
                            background: "var(--color-status-rejected-bg)",
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                        }}
                    >
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
            </form>
            <p style={{ marginTop: 12 }}>
                ยังไม่มีร้าน? <Link to="/seller/register">สมัครเปิดร้าน</Link>
            </p>
        </div>
    );
}