import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../firebase/auth";

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

        const { user, error: authError } = await loginUser(email, password);
        setLoading(false);

        if (authError) {
            setError(authError);
            return;
        }

        navigate("/seller/dashboard");
    }

    return (
        <div style={{ maxWidth: 400, margin: "40px auto" }}>
            <h2>เข้าสู่ระบบร้านค้า</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>อีเมล</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>รหัสผ่าน</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
            </form>
            <p>
                ยังไม่มีร้าน? <Link to="/seller/register">สมัครเปิดร้าน</Link>
            </p>
        </div>
    );
}