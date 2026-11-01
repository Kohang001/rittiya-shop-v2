// src/components/shop/CheckoutModal.jsx — Mobile-First Bottom Sheet + Zero-Emoji + Pickup Location & Auto-fill
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { saveUserProfile } from "../../firebase/firestore";
import { generatePromptPayQR } from "../../utils/promptpay";
import { uploadImage } from "../../cloudinary/upload";
import { validateImageFile } from "../../utils/validators";
import Icon from "../ui/Icon";

/**
 * @param {object} paymentInfo - { promptpayId, bankName, bankAccountNumber, bankAccountName }
 */
export default function CheckoutModal({ shopId, items, total, paymentInfo, onConfirm, onClose }) {
    const { user, userProfile } = useAuth();
    const [clientOrderId] = useState(() => crypto.randomUUID());
    const [step, setStep] = useState(0); // 0 = ข้อมูล, 1 = ชำระเงิน+สลิป, 2 = สำเร็จ

    // ข้อมูลลูกค้า พร้อมดึงข้อมูลอัตโนมัติจากโปรไฟล์ผู้ใช้
    const [customerName, setCustomerName] = useState(() => userProfile?.displayName || user?.displayName || "");
    const [customerContact, setCustomerContact] = useState(() => userProfile?.phone || "");
    const [pickupLocation, setPickupLocation] = useState(() => userProfile?.defaultPickupLocation || "");
    const [saveToProfile, setSaveToProfile] = useState(true);
    const [consentChecked, setConsentChecked] = useState(false);
    const [error, setError] = useState("");

    // ดึงข้อมูลอัตโนมัติเมื่อ userProfile โหลดเสร็จ
    useEffect(() => {
        if (userProfile) {
            setCustomerName((prev) => prev || userProfile.displayName || "");
            setCustomerContact((prev) => prev || userProfile.phone || "");
            setPickupLocation((prev) => prev || userProfile.defaultPickupLocation || "");
        }
    }, [userProfile]);

    const [slipUrl, setSlipUrl] = useState(null);
    const [slipPreview, setSlipPreview] = useState(null);
    const [slipUploading, setSlipUploading] = useState(false);
    const [slipError, setSlipError] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [copiedAccount, setCopiedAccount] = useState(false);

    function goToPaymentStep(e) {
        e.preventDefault();
        if (!customerName.trim() || !customerContact.trim()) {
            setError("กรุณากรอกชื่อและช่องทางติดต่อให้ครบถ้วน");
            return;
        }
        if (!pickupLocation.trim()) {
            setError("กรุณากรอกสถานที่นัดรับสินค้า (เช่น โต๊ะโรงอาหาร, หน้าตึก, หรือห้องเรียน)");
            return;
        }
        if (!consentChecked) {
            setError("กรุณายืนยันความยินยอมในการใช้ข้อมูลก่อนสั่งซื้อ");
            return;
        }
        setError("");
        setStep(1);

        if (paymentInfo?.promptpayId) {
            generatePromptPayQR(paymentInfo.promptpayId, total)
                .then(setQrDataUrl)
                .catch((err) => console.error("สร้าง QR ไม่สำเร็จ:", err));
        }
    }

    async function handleSlipFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const check = validateImageFile(file);
        if (!check.valid) {
            setSlipError(check.error);
            return;
        }
        setSlipError("");
        setSlipPreview(URL.createObjectURL(file));
        setSlipUploading(true);
        try {
            const url = await uploadImage(file);
            setSlipUrl(url);
        } catch (err) {
            setSlipError(err.message || "อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง");
            setSlipPreview(null);
        } finally {
            setSlipUploading(false);
        }
    }

    async function handleFinalConfirm() {
        if (!slipUrl) {
            setSlipError("กรุณาแนบสลิปการโอนเงินก่อนยืนยันสั่งซื้อ");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const result = await onConfirm({
                customerName,
                customerContact,
                pickupLocation,
                slipUrl,
                clientOrderId,
            });

            // บันทึกข้อมูลกลับเข้าโปรไฟล์ผู้ใช้เพื่อกรอกอัตโนมัติในครั้งถัดไป
            if (user && saveToProfile) {
                saveUserProfile(user.uid, {
                    displayName: customerName.trim(),
                    phone: customerContact.trim(),
                    defaultPickupLocation: pickupLocation.trim(),
                }).catch((profileErr) => {
                    console.warn("บันทึกข้อมูลโปรไฟล์อัตโนมัติไม่สำเร็จ:", profileErr);
                });
            }

            setSuccessData(result);
            setStep(2);
        } catch (err) {
            setError(err.message || "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSubmitting(false);
        }
    }

    function handleCopyBankAccount(accountNum) {
        if (!accountNum) return;
        navigator.clipboard.writeText(accountNum);
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
    }

    const hasBankInfo = paymentInfo?.bankName && paymentInfo?.bankAccountNumber && paymentInfo?.bankAccountName;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-modal-title"
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.55)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "flex-end", // Mobile bottom-sheet default
                justifyContent: "center",
                padding: 0,
                zIndex: 1000,
            }}
            onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
        >
            <div
                style={{
                    background: "var(--color-bg)",
                    borderTopLeftRadius: "20px",
                    borderTopRightRadius: "20px",
                    padding: "20px 24px calc(24px + env(safe-area-inset-bottom, 0px))",
                    maxWidth: 460,
                    width: "100%",
                    maxHeight: "90dvh",
                    overflowY: "auto",
                    boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.2)",
                }}
                className="checkout-sheet-panel"
            >
                {/* Drag handle for mobile bottom sheet look */}
                <div
                    style={{
                        width: 38,
                        height: 4,
                        borderRadius: 2,
                        background: "var(--color-border)",
                        margin: "0 auto 16px",
                    }}
                />

                {step === 2 && successData && (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ marginBottom: 16 }}>
                            <Icon name="verified-shield" size={54} color="var(--color-success)" />
                        </div>
                        <h2 id="checkout-modal-title" style={{ fontSize: 20, marginBottom: 8 }}>
                            สั่งซื้อสำเร็จเรียบร้อย
                        </h2>
                        <p style={{ color: "var(--color-text-muted)", fontSize: 15, marginBottom: 12 }}>
                            ยอดรวมคำสั่งซื้อ: <strong style={{ color: "var(--color-text)" }}>{successData.total.toLocaleString()} บาท</strong>
                        </p>
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 6,
                                padding: "12px 14px",
                                background: "#ecfdf5",
                                color: "#065f46",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid #a7f3d0",
                                fontSize: 13,
                                width: "100%",
                                marginBottom: 20,
                                textAlign: "left",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                                <Icon name="check" size={16} color="#059669" />
                                <span>ร้านค้าได้รับข้อมูลและสลิปแล้ว กำลังจัดเตรียมออเดอร์</span>
                            </div>
                            <div style={{ color: "var(--color-text)", fontSize: 12, marginTop: 4 }}>
                                📍 สถานที่นัดรับ: <strong>{pickupLocation}</strong>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} style={{ width: "100%", minHeight: 44, justifyContent: "center" }}>
                            ปิดหน้าต่างนี้
                        </button>
                    </div>
                )}

                {step === 0 && (
                    <form onSubmit={goToPaymentStep}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h2 id="checkout-modal-title" style={{ margin: 0, fontSize: "clamp(17px, 4.5vw, 20px)" }}>
                                ตรวจสอบรายการสั่งซื้อ
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ border: "none", background: "transparent", padding: 6, minHeight: "unset" }}
                                aria-label="ปิด"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        {/* กล่องแจ้งเตือนสถานะการกรอกข้อมูลอัตโนมัติ */}
                        {user ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 10px",
                                    background: "rgba(13, 148, 136, 0.08)",
                                    border: "1px solid rgba(13, 148, 136, 0.2)",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: 12,
                                    color: "var(--color-primary)",
                                    marginBottom: 12,
                                }}
                            >
                                <Icon name="verified-shield" size={14} color="var(--color-primary)" />
                                <span>ดึงข้อมูลชื่อ เบอร์ และสถานที่นัดรับจากบัญชีของคุณอัตโนมัติ</span>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 10px",
                                    background: "var(--color-bg-subtle)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: 12,
                                    color: "var(--color-text-muted)",
                                    marginBottom: 12,
                                    flexWrap: "wrap",
                                    gap: 4,
                                }}
                            >
                                <span>สั่งซื้อได้ทันที ไม่ต้องสมัครสมาชิก</span>
                                <Link to="/login" style={{ fontWeight: 600 }}>เข้าสู่ระบบเพื่อจำข้อมูล</Link>
                            </div>
                        )}

                        <div
                            style={{
                                background: "var(--color-bg-subtle)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                padding: 12,
                                marginBottom: 16,
                            }}
                        >
                            {items.map(({ product, qty }) => (
                                <div key={product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                                    <span style={{ color: "var(--color-text)" }}>
                                        {product.name} × {qty}
                                    </span>
                                    <span style={{ fontWeight: 500 }}>{(product.price * qty).toLocaleString()} บาท</span>
                                </div>
                            ))}
                            <hr style={{ borderColor: "var(--color-border)", margin: "8px 0" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
                                <span>ยอดรวมทั้งหมด</span>
                                <span style={{ color: "var(--color-primary)" }}>{total.toLocaleString()} บาท</span>
                            </div>
                        </div>

                        <label htmlFor="checkout-name">
                            ชื่อผู้สั่งซื้อ (สำหรับจัดส่ง/นัดรับ) <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <input
                            id="checkout-name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="ระบุชื่อของคุณ"
                            style={{ display: "block", width: "100%", marginBottom: 12 }}
                            autoFocus={!customerName}
                            required
                        />

                        <label htmlFor="checkout-contact">
                            เบอร์โทรศัพท์ หรือ Instagram ID ติดต่อกลับ <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <input
                            id="checkout-contact"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            placeholder="เช่น 0812345678 หรือ @your_ig"
                            style={{ display: "block", width: "100%", marginBottom: 12 }}
                            required
                        />

                        <label htmlFor="checkout-pickup">
                            สถานที่นัดรับสินค้า <span style={{ color: "var(--color-danger)" }}>*</span>
                        </label>
                        <input
                            id="checkout-pickup"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            placeholder="เช่น โต๊ะ 5 โรงอาหาร, หน้าตึก 3 ชั้น 1, ห้อง ม.6/2"
                            style={{ display: "block", width: "100%", marginBottom: 12 }}
                            required
                        />

                        {user && (
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 12, cursor: "pointer", color: "var(--color-text)" }}>
                                <input
                                    type="checkbox"
                                    checked={saveToProfile}
                                    onChange={(e) => setSaveToProfile(e.target.checked)}
                                />
                                <span>บันทึกชื่อ เบอร์ และสถานที่นัดรับนี้ไว้ใช้ครั้งถัดไปอัตโนมัติ</span>
                            </label>
                        )}

                        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 10 }}>{error}</p>}

                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, fontWeight: 400, marginBottom: 16, cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                                style={{ marginTop: 2 }}
                            />
                            <span style={{ color: "var(--color-text-secondary)" }}>
                                ฉันยินยอมให้ร้านค้าเก็บและใช้ชื่อ-เบอร์ติดต่อนี้ เพื่อการติดต่อประสานงานเกี่ยวกับคำสั่งซื้อนี้เท่านั้น
                            </span>
                        </label>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button type="button" onClick={onClose} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
                                ยกเลิก
                            </button>
                            <button type="submit" style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
                                ดำเนินการชำระเงิน <Icon name="arrow-right" size={16} />
                            </button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <h2 id="checkout-modal-title" style={{ margin: 0, fontSize: "clamp(17px, 4.5vw, 20px)" }}>
                                ช่องทางการชำระเงิน
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ border: "none", background: "transparent", padding: 6, minHeight: "unset" }}
                                aria-label="ปิด"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        {/* ข้อมูลสรุปจุดนัดรับ */}
                        <div
                            style={{
                                padding: "10px 12px",
                                background: "var(--color-bg-subtle)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: 13,
                                marginBottom: 14,
                                lineHeight: 1.5,
                            }}
                        >
                            <div>ผู้สั่ง: <strong>{customerName}</strong> ({customerContact})</div>
                            <div>สถานที่นัดรับ: <strong style={{ color: "var(--color-primary)" }}>{pickupLocation}</strong></div>
                        </div>

                        <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 16 }}>
                            ยอดที่ต้องโอน: <strong style={{ color: "var(--color-primary)", fontSize: 15 }}>{total.toLocaleString()} บาท</strong>
                        </p>

                        {qrDataUrl && (
                            <div
                                className="card"
                                style={{
                                    textAlign: "center",
                                    padding: 16,
                                    marginBottom: 16,
                                    background: "#ffffff",
                                }}
                            >
                                <img
                                    src={qrDataUrl}
                                    alt="PromptPay QR Code"
                                    style={{ width: 190, height: 190, margin: "0 auto", display: "block", borderRadius: 8 }}
                                />
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 12,
                                        color: "var(--color-text-muted)",
                                        marginTop: 8,
                                    }}
                                >
                                    <Icon name="phone" size={13} /> สแกนผ่านแอปธนาคารใดก็ได้
                                </span>
                            </div>
                        )}

                        {hasBankInfo && (
                            <div className="card" style={{ padding: 14, marginBottom: 16, fontSize: 13 }}>
                                <p style={{ margin: "0 0 6px 0", fontWeight: 600, color: "var(--color-text-muted)" }}>
                                    หรือโอนเข้าบัญชีธนาคาร
                                </p>
                                <p style={{ margin: "0 0 4px 0" }}>ธนาคาร: <strong>{paymentInfo.bankName}</strong></p>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px 0" }}>
                                    <span>เลขบัญชี: <strong>{paymentInfo.bankAccountNumber}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyBankAccount(paymentInfo.bankAccountNumber)}
                                        style={{ padding: "2px 8px", fontSize: 12, minHeight: 28 }}
                                    >
                                        <Icon name={copiedAccount ? "check" : "copy"} size={12} color={copiedAccount ? "var(--color-success)" : "currentColor"} />
                                        <span>{copiedAccount ? "คัดลอกแล้ว" : "คัดลอก"}</span>
                                    </button>
                                </div>
                                <p style={{ margin: 0 }}>ชื่อบัญชี: <strong>{paymentInfo.bankAccountName}</strong></p>
                            </div>
                        )}

                        <label htmlFor="slip-upload" style={{ fontWeight: 600 }}>
                            แนบสลิปหลักฐานการโอนเงิน (จำเป็น)
                        </label>
                        {slipPreview && (
                            <div style={{ marginBottom: 10 }}>
                                <img
                                    src={slipPreview}
                                    alt="ตัวอย่างสลิป"
                                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border)" }}
                                />
                            </div>
                        )}
                        <input
                            id="slip-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleSlipFileChange}
                            disabled={slipUploading}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {slipUploading && <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>กำลังอัปโหลดสลิป...</p>}
                        {slipError && <p style={{ fontSize: 12, color: "var(--color-danger)" }}>{slipError}</p>}
                        {slipUrl && !slipUploading && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-success)", fontSize: 12, marginBottom: 8 }}>
                                <Icon name="check" size={14} color="var(--color-success)" />
                                <span>แนบสลิปเรียบร้อยแล้ว</span>
                            </div>
                        )}

                        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, margin: "10px 0" }}>{error}</p>}

                        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                            <button type="button" onClick={() => setStep(0)} disabled={submitting} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
                                <Icon name="arrow-left" size={16} /> ย้อนกลับ
                            </button>
                            <button
                                type="submit"
                                onClick={handleFinalConfirm}
                                disabled={submitting || !slipUrl || slipUploading}
                                style={{ flex: 1, minHeight: 44, justifyContent: "center" }}
                            >
                                {submitting ? "กำลังส่งคำสั่งซื้อ..." : "ยืนยันการสั่งซื้อ"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
