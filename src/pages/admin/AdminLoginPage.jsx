// src/pages/admin/AdminLoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../firebase/auth";

export default function AdminLoginPage() {
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

        // ไม่เช็ค isAdmin ตรงนี้ — ปล่อยให้ AdminRoute เป็นคนเช็คและเด้งออกถ้าไม่ใช่ admin
        navigate("/admin/shops");
    }

    return (
        <div style={{ maxWidth: 380, margin: "80px auto", padding: "0 16px" }}>
            <h2>Admin Login</h2>
            <form onSubmit={handleSubmit}>
                <label>อีเมล</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />
                <label>รหัสผ่าน</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
            </form>
        </div>
    );
}