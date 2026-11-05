// src/pages/seller/SellerLineLinkPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopsByOwner, generateNewShopLineCode, unlinkShopLine } from "../../firebase/firestore";
import PageSkeleton from "../../components/ui/PageSkeleton";
import Icon from "../../components/ui/Icon";

export default function SellerLineLinkPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const shops = await getShopsByOwner(user.uid);
                setShop(shops[0] || null);
            } catch (err) {
                console.error("Failed to load shop:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    async function handleGenerateNewCode() {
        if (!shop) return;
        setGenerating(true);
        try {
            const newCode = await generateNewShopLineCode(shop.id);
            setShop((prev) => ({ ...prev, lineLinkCode: newCode }));
            showToast("สร้างรหัสเชื่อมต่อชุดใหม่เรียบร้อยแล้ว", "success");
        } catch (err) {
            console.error("Failed to generate code:", err);
            showToast("ไม่สามารถสร้างรหัสใหม่ได้ กรุณาลองอีกครั้ง", "error");
        } finally {
            setGenerating(false);
        }
    }

    async function handleUnlink() {
        if (!window.confirm("คุณต้องการยกเลิกการผูกบัญชี LINE ใช่หรือไม่? หากยกเลิกคุณจะไม่ได้รับการแจ้งเตือนออเดอร์ทาง LINE")) return;
        setGenerating(true);
        try {
            await unlinkShopLine(shop.id);
            setShop((prev) => ({ ...prev, lineUserId: null, lineLinkCode: null }));
            showToast("ยกเลิกการผูก LINE สำเร็จ", "info");
        } catch (err) {
            console.error("Failed to unlink LINE:", err);
            showToast("ยกเลิกการผูก LINE ไม่สำเร็จ", "error");
        } finally {
            setGenerating(false);
        }
    }

    function handleCopy(code) {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        showToast("คัดลอกรหัสเชื่อมต่อแล้ว", "success");
        setTimeout(() => setCopied(false), 2500);
    }

    if (loading) return <PageSkeleton lines={4} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    const isConnected = Boolean(shop.lineUserId);

    return (
        <div style={{ maxWidth: 540, margin: "32px auto", padding: "0 16px" }}>
            <div style={{ marginBottom: 20 }}>
                <Link
                    to="/seller/dashboard"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "var(--color-text-muted)",
                        textDecoration: "none",
                        marginBottom: 12,
                    }}
                >
                    <Icon name="arrow-left" size={14} /> กลับแดชบอร์ดร้านค้า
                </Link>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>
                    เชื่อมต่อ LINE Official Account
                </h1>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                    ร้าน "{shop.name}" · รับการแจ้งเตือนออเดอร์ใหม่พร้อมสลิปโอนเงิน และควบคุมเปิด/ปิดร้านผ่าน LINE ทันที
                </p>
            </div>

            {isConnected ? (
                <div
                    className="card"
                    style={{
                        padding: 24,
                        textAlign: "center",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        background: "rgba(16, 185, 129, 0.05)",
                    }}
                >
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "var(--color-success)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 14px",
                        }}
                    >
                        <Icon name="check-circle" size={28} color="var(--color-success)" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>
                        เชื่อมต่อ LINE สำเร็จแล้ว
                    </h3>
                    <p style={{ margin: "8px 0 16px", fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                        ร้านของคุณเชื่อมต่อกับ LINE Official Account เรียบร้อยแล้ว<br />
                        จะได้รับแจ้งเตือนออเดอร์ใหม่พร้อมรูปสลิปทันทีที่มีลูกค้าสั่งซื้อ
                    </p>

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-bg-subtle)",
                            fontSize: 13,
                            color: "var(--color-text-muted)",
                            marginBottom: 14,
                        }}
                    >
                        <Icon name="shield" size={14} color="var(--color-success)" />
                        รหัสเชื่อมต่อเดิมถูกล้างทิ้งอัตโนมัติแล้วเพื่อความปลอดภัย (One-Time Code)
                    </div>

                    <p style={{ margin: "0 0 20px 0", fontSize: 13, color: "#d97706" }}>
                        💡 คำสั่งยกเลิกผูกในแชท: สามารถพิมพ์คำว่า <strong>unlink</strong> ใน LINE เพื่อยกเลิกการเชื่อมต่อได้ทันที
                    </p>

                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                        <button
                            type="button"
                            onClick={handleUnlink}
                            disabled={generating}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                background: "var(--color-bg-surface)",
                                color: "var(--color-danger, #ef4444)",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            ยกเลิกการเชื่อมต่อ
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="card"
                    style={{
                        padding: 24,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(37, 99, 235, 0.08)",
                            border: "1px solid rgba(37, 99, 235, 0.2)",
                            fontSize: 13,
                            color: "var(--color-primary)",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 20,
                        }}
                    >
                        <Icon name="info" size={16} />
                        <span>รหัสเชื่อมต่อใช้งานได้ <strong>ครั้งเดียว</strong> แล้วทิ้งทันที เพื่อความปลอดภัยสูงสุด</span>
                    </div>

                    <h3 style={{ fontSize: 16, margin: "0 0 14px 0", fontWeight: 600 }}>
                        ขั้นตอนที่ 1: สแกน QR Code เพื่อเพิ่มเพื่อน
                    </h3>

                    <img
                        src="/line-qr.png"
                        alt="LINE Official Account QR Code"
                        style={{
                            width: 190,
                            height: 190,
                            objectFit: "contain",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                            padding: 8,
                            background: "#fff",
                            marginBottom: 16,
                        }}
                    />

                    <h3 style={{ fontSize: 16, margin: "0 0 8px 0", fontWeight: 600 }}>
                        ขั้นตอนที่ 2: พิมพ์รหัสเชื่อมต่อ 6 หลักในแชท
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px 0", maxWidth: 380 }}>
                        ส่งตัวเลข 6 หลักนี้ไปยัง LINE Official Account เพื่อเชื่อมต่อร้านค้าของคุณเข้ากับระบบ
                    </p>

                    {shop.lineLinkCode ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 12,
                                width: "100%",
                            }}
                        >
                            <div
                                style={{
                                    background: "var(--color-bg-subtle)",
                                    border: "2px dashed var(--color-primary)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "12px 28px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 14,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 32,
                                        fontWeight: 800,
                                        letterSpacing: 6,
                                        color: "var(--color-primary)",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {shop.lineLinkCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(shop.lineLinkCode)}
                                    title="คัดลอกรหัส"
                                    style={{
                                        background: "none",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-sm)",
                                        padding: "6px 10px",
                                        cursor: "pointer",
                                        fontSize: 12,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        color: copied ? "var(--color-success)" : "var(--color-text-muted)",
                                    }}
                                >
                                    <Icon name={copied ? "check" : "copy"} size={14} />
                                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateNewCode}
                                disabled={generating}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--color-text-muted)",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    padding: 4,
                                }}
                            >
                                {generating ? "กำลังสร้างรหัส..." : "รหัสไม่ทำงาน? ขอรหัสเชื่อมต่อชุดใหม่"}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", marginTop: 8 }}>
                            <p style={{ fontSize: 13, color: "var(--color-danger, #ef4444)", marginBottom: 12 }}>
                                ยังไม่มีรหัสเชื่อมต่อ หรือรหัสเดิมถูกใช้งานไปแล้ว
                            </p>
                            <button
                                type="button"
                                onClick={handleGenerateNewCode}
                                disabled={generating}
                                className="nav-link-btn"
                                style={{
                                    justifyContent: "center",
                                    gap: 8,
                                    padding: "8px 20px",
                                    fontSize: 14,
                                }}
                            >
                                <Icon name="refresh" size={16} />
                                {generating ? "กำลังสร้างรหัส..." : "ขอรหัสเชื่อมต่อใหม่ (ใช้ครั้งเดียว)"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
