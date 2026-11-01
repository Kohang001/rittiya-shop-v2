// src/pages/public/ProfilePage.jsx
// หน้าโปรไฟล์ข้อมูลส่วนตัวสำหรับผู้ใช้ทั่วไป (จัดการชื่อ เบอร์ติดต่อ และสถานที่นัดรับประจำ)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { saveUserProfile } from "../../firebase/firestore";
import { validatePhone } from "../../utils/validators";
import Breadcrumb from "../../components/ui/Breadcrumb";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";

export default function ProfilePage() {
    const { user, userProfile, refreshUserProfile, isAdmin, adminRole } = useAuth();
    const { showToast } = useToast();

    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [defaultPickupLocation, setDefaultPickupLocation] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || "");
            setPhone(userProfile.phone || "");
            setDefaultPickupLocation(userProfile.defaultPickupLocation || "");
        }
    }, [userProfile]);

    async function handleSave(e) {
        e.preventDefault();
        if (!displayName.trim()) {
            showToast("กรุณากรอกชื่อของคุณ", "error");
            return;
        }

        const phoneClean = phone.trim().replace(/-/g, "");
        if (phoneClean) {
            const check = validatePhone(phoneClean);
            if (!check.valid) {
                showToast(check.error || "เบอร์โทรศัพท์ไม่ถูกต้อง", "error");
                return;
            }
        }

        setSaving(true);
        try {
            await saveUserProfile(user.uid, {
                displayName: displayName.trim(),
                phone: phoneClean,
                defaultPickupLocation: defaultPickupLocation.trim(),
            });
            await refreshUserProfile(user.uid);
            showToast("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว", "success");
        } catch (err) {
            console.error("Save profile error:", err);
            showToast("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "error");
        } finally {
            setSaving(false);
        }
    }

    if (!user) {
        return <PageSkeleton lines={4} />;
    }

    return (
        <div style={{ maxWidth: 640, margin: "32px auto", padding: "0 16px" }}>
            <Breadcrumb items={[{ label: "หน้าแรก", to: "/" }, { label: "ข้อมูลส่วนตัวของฉัน" }]} />

            <div
                className="card"
                style={{
                    padding: 24,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-surface)",
                    boxShadow: "var(--shadow-sm)",
                    marginBottom: 20,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            background: "rgba(13, 148, 136, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "var(--color-primary)",
                        }}
                    >
                        {displayName ? displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                                {displayName || "ผู้ใช้งาน"}
                            </h2>
                            {isAdmin ? (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "2px 8px",
                                        borderRadius: "var(--radius-sm)",
                                        background: adminRole === "super" ? "rgba(99, 102, 241, 0.12)" : "rgba(59, 130, 246, 0.12)",
                                        color: adminRole === "super" ? "#6366f1" : "#3b82f6",
                                        border: `1px solid ${adminRole === "super" ? "rgba(99, 102, 241, 0.25)" : "rgba(59, 130, 246, 0.25)"}`,
                                    }}
                                >
                                    {adminRole === "super" ? "Super Admin" : "Normal Admin"}
                                </span>
                            ) : (
                                <span
                                    style={{
                                        fontSize: 11,
                                        padding: "2px 8px",
                                        borderRadius: "var(--radius-sm)",
                                        background: "var(--color-bg-subtle)",
                                        color: "var(--color-text-muted)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    สมาชิกทั่วไป (ผู้ซื้อ)
                                </span>
                            )}
                        </div>
                        <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                            {user.email}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        padding: "12px 14px",
                        background: "rgba(13, 148, 136, 0.06)",
                        border: "1px solid rgba(13, 148, 136, 0.18)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                        color: "var(--color-text)",
                        marginBottom: 20,
                        lineHeight: 1.5,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--color-primary)", marginBottom: 2 }}>
                        <Icon name="verified-shield" size={15} color="var(--color-primary)" />
                        <span>ระบบกรอกข้อมูลอัตโนมัติ (Auto-fill)</span>
                    </div>
                    ข้อมูลที่คุณตั้งค่าไว้ที่นี่ จะถูกนำไปกรอกลงในหน้าชำระเงินโดยอัตโนมัติเมื่อสั่งซื้อสินค้าจากทุกร้านค้าในโรงเรียน
                </div>

                <form onSubmit={handleSave}>
                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="profile-name" style={{ fontWeight: 600 }}>
                            ชื่อ-นามสกุล / ชื่อเล่นสำหรับสั่งสินค้า <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <input
                            id="profile-name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="เช่น สมชาย ใจดี (น้องมินต์ ม.5/2)"
                            style={{ display: "block", width: "100%" }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="profile-phone" style={{ fontWeight: 600 }}>
                            เบอร์โทรศัพท์ติดต่อ (10 หลัก)
                        </label>
                        <input
                            id="profile-phone"
                            type="tel"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="เช่น 0812345678"
                            style={{ display: "block", width: "100%" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2, display: "block" }}>
                            ใส่เฉพาะตัวเลข 10 หลัก สำหรับให้แม่ค้าติดต่อเมื่ออาหารหรือสินค้าพร้อมส่ง
                        </span>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label htmlFor="profile-pickup" style={{ fontWeight: 600 }}>
                            สถานที่นัดรับประจำ (Default Pickup Location)
                        </label>
                        <input
                            id="profile-pickup"
                            type="text"
                            value={defaultPickupLocation}
                            onChange={(e) => setDefaultPickupLocation(e.target.value)}
                            placeholder="เช่น หน้าตึก 3 ชั้น 1, โรงอาหารโต๊ะ 12, ห้อง ม.5/2"
                            style={{ display: "block", width: "100%" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2, display: "block" }}>
                            สถานที่ที่คุณมักสะดวกให้แม่ค้านัดส่งของ สามารถเปลี่ยนได้เสมอตอนสั่งซื้อ
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
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
                        {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </button>
                </form>
            </div>

            {/* Quick Links Card */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-subtle)",
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <strong style={{ display: "block", fontSize: 14 }}>ต้องการเปิดร้านขายของ?</strong>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        สร้างร้านค้าและวางขายสินค้าในระบบ Rittiya Shop
                    </span>
                </div>
                <Link
                    to="/seller/register"
                    style={{
                        padding: "8px 14px",
                        background: "var(--color-bg-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text)",
                        textDecoration: "none",
                    }}
                >
                    สมัครเปิดร้านค้า
                </Link>
            </div>
        </div>
    );
}

