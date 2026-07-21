import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
    const { user } = useAuth();

    return (
        <nav
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #eee",
                flexWrap: "wrap",
                gap: 10,
            }}
        >
            <Link to="/" style={{ fontWeight: "bold", fontSize: 18, textDecoration: "none", color: "inherit" }}>
                Rittiya Shop
            </Link>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Link to="/">ร้านค้า</Link>
                <Link to="/feed">ประกาศ</Link>
                {user ? (
                    <Link to="/seller/dashboard">Dashboard ร้านฉัน</Link>
                ) : (
                    <>
                        <Link to="/seller/login">เข้าสู่ระบบ</Link>
                        <Link to="/seller/register">เปิดร้านค้า</Link>
                    </>
                )}
            </div>
        </nav>
    );
}