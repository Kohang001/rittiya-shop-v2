// src/pages/seller/PendingApprovalPage.jsx
import { useLocation, Link } from "react-router-dom";

export default function PendingApprovalPage() {
    const location = useLocation();
    const lineLinkCode = location.state?.lineLinkCode;

    return (
        <div style={{ maxWidth: 480, margin: "40px auto", textAlign: "center", padding: "0 16px" }}>
            <h2 style={{ marginBottom: 8 }}>สมัครร้านสำเร็จ!</h2>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>
                ร้านของคุณอยู่ระหว่างรอการตรวจสอบจากทีมงาน จะใช้เวลาไม่นาน
            </p>

            <div
                className="card"
                style={{
                    padding: 24,
                    marginBottom: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>สแกน QR Code เพื่อเชื่อมต่อ LINE</h3>
                <img
                    src="/line-qr.png"
                    alt="LINE Official Account QR Code"
                    style={{
                        width: 200,
                        height: 200,
                        objectFit: "contain",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        padding: 8,
                        background: "#fff",
                        marginBottom: 16,
                    }}
                />
                <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 12px 0" }}>
                    เพิ่มเพื่อน LINE Official Account แล้วพิมพ์รหัสนี้ส่งไปในแชทเพื่อรับการแจ้งเตือนออเดอร์:
                </p>

                {lineLinkCode ? (
                    <div
                        style={{
                            background: "var(--color-bg-subtle)",
                            border: "1px dashed var(--color-primary)",
                            borderRadius: "var(--radius-sm)",
                            padding: "10px 20px",
                            display: "inline-block",
                        }}
                    >
                        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "var(--color-primary)" }}>
                            {lineLinkCode}
                        </span>
                    </div>
                ) : (
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                        (สามารถดูรหัสเชื่อมต่อ LINE ได้ที่หน้า Dashboard)
                    </p>
                )}
            </div>

            <Link
                to="/seller/dashboard"
                style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    background: "var(--color-primary)",
                    color: "#fff",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                    textDecoration: "none",
                }}
            >
                ไปที่ Dashboard ร้านของฉัน
            </Link>
        </div>
    );
}