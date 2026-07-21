// src/pages/seller/PendingApprovalPage.jsx
import { useLocation, Link } from "react-router-dom";

export default function PendingApprovalPage() {
    const location = useLocation();
    const lineLinkCode = location.state?.lineLinkCode;

    return (
        <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center", padding: "0 16px" }}>
            <h2>สมัครร้านสำเร็จ!</h2>
            <p style={{ color: "#666" }}>
                ร้านของคุณอยู่ระหว่างรอการตรวจสอบจากทีมงาน จะใช้เวลาไม่นาน
            </p>

            {lineLinkCode && (
                <div
                    style={{
                        border: "2px dashed #333",
                        borderRadius: 12,
                        padding: 20,
                        margin: "20px 0",
                    }}
                >
                    <p style={{ marginBottom: 8 }}>
                        เพิ่มเพื่อน LINE Official Account ของเรา แล้วพิมพ์รหัสนี้ส่งไปในแชท
                        เพื่อรับการแจ้งเตือนออเดอร์:
                    </p>
                    <p style={{ fontSize: 32, fontWeight: "bold", letterSpacing: 4 }}>
                        {lineLinkCode}
                    </p>
                </div>
            )}

            <Link to="/seller/dashboard">ไปที่ Dashboard ร้านของฉัน</Link>
        </div>
    );
}