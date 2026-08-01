// src/components/shop/CheckoutModal.jsx — อัปเดต: ต้องแนบสลิปก่อนถึงจะสร้างออเดอร์จริง
import { useState } from "react";
import { generatePromptPayQR } from "../../utils/promptpay";
import { uploadImage } from "../../cloudinary/upload";
import { validateImageFile } from "../../utils/validators";

/**
 * @param {object} paymentInfo - { promptpayId, bankName, bankAccountNumber, bankAccountName }
 *   ส่งมาจาก shop ที่โหลดไว้แล้วในหน้า ShopDetailPage ไม่ต้องรอ API
 */
export default function CheckoutModal({ shopId, items, total, paymentInfo, onConfirm, onClose }) {
    const [step, setStep] = useState(0); // 0 = กรอกข้อมูล, 1 = จ่ายเงิน+แนบสลิป, 2 = สำเร็จ
    const [customerName, setCustomerName] = useState("");
    const [customerContact, setCustomerContact] = useState("");
    const [consentChecked, setConsentChecked] = useState(false);
    const [error, setError] = useState("");

    const [slipUrl, setSlipUrl] = useState(null);
    const [slipPreview, setSlipPreview] = useState(null);
    const [slipUploading, setSlipUploading] = useState(false);
    const [slipError, setSlipError] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);

    function goToPaymentStep(e) {
        e.preventDefault();
        if (!customerName.trim() || !customerContact.trim()) {
            setError("กรุณากรอกชื่อและช่องทางติดต่อให้ครบ");
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
            const result = await onConfirm({ customerName, customerContact, slipUrl });
            setSuccessData(result);
            setStep(2);
        } catch (err) {
            setError(err.message || "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSubmitting(false);
        }
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
                background: "rgba(15, 23, 42, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 1000,
            }}
            onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
        >
            <div
                style={{
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-lg)",
                    padding: 24,
                    maxWidth: 420,
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "var(--shadow-md)",
                }}
            >
                {step === 2 && successData && (
                    <div style={{ textAlign: "center" }}>
                        <h2 id="checkout-modal-title">สั่งซื้อสำเร็จ</h2>
                        <p style={{ color: "var(--color-text-muted)" }}>
                            ยอดรวม <strong>{successData.total.toLocaleString()} บาท</strong>
                        </p>
                        <p style={{ color: "var(--color-success)", fontSize: 14 }}>
                            ✅ ร้านได้รับสลิปของคุณแล้ว รอตรวจสอบและติดต่อกลับ
                        </p>
                        <button type="submit" onClick={onClose} style={{ width: "100%", marginTop: 12 }}>
                            ปิดหน้าต่างนี้
                        </button>
                    </div>
                )}

                {step === 0 && (
                    <form onSubmit={goToPaymentStep}>
                        <h2 id="checkout-modal-title" style={{ marginBottom: 12 }}>
                            ตรวจสอบคำสั่งซื้อ
                        </h2>

                        <div style={{ marginBottom: 16 }}>
                            {items.map(({ product, qty }) => (
                                <div key={product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                                    <span>
                                        {product.name} × {qty}
                                    </span>
                                    <span>{(product.price * qty).toLocaleString()} บาท</span>
                                </div>
                            ))}
                            <hr style={{ borderColor: "var(--color-border)" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                                <span>ยอดรวม</span>
                                <span>{total.toLocaleString()} บาท</span>
                            </div>
                        </div>

                        <label htmlFor="checkout-name">ชื่อผู้สั่งซื้อ</label>
                        <input
                            id="checkout-name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                            autoFocus
                        />

                        <label htmlFor="checkout-contact">เบอร์โทรหรือไอจีติดต่อกลับ</label>
                        <input
                            id="checkout-contact"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                        />

                        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 10 }}>{error}</p>}

                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, fontWeight: 400, marginBottom: 12 }}>
                            <input
                                type="checkbox"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                                style={{ marginTop: 2 }}
                            />
                            <span>ฉันยินยอมให้ร้านค้าเก็บและใช้ชื่อ-เบอร์ติดต่อนี้ เพื่อการติดต่อเกี่ยวกับคำสั่งซื้อนี้เท่านั้น</span>
                        </label>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={onClose} style={{ flex: 1 }}>
                                ยกเลิก
                            </button>
                            <button type="submit" style={{ flex: 1, justifyContent: "center" }}>
                                ถัดไป
                            </button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <div>
                        <h2 id="checkout-modal-title" style={{ marginBottom: 4 }}>
                            ชำระเงิน
                        </h2>
                        <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 16 }}>
                            ยอดที่ต้องโอน: <strong>{total.toLocaleString()} บาท</strong>
                        </p>

                        {qrDataUrl && (
                            <div style={{ textAlign: "center", marginBottom: 16 }}>
                                <img src={qrDataUrl} alt="PromptPay QR Code" style={{ width: 200, height: 200, margin: "0 auto", display: "block" }} />
                                <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8 }}>สแกนจ่ายผ่านพร้อมเพย์</p>
                            </div>
                        )}

                        {hasBankInfo && (
                            <div className="card" style={{ padding: 14, marginBottom: 16 }}>
                                <p style={{ margin: "0 0 4px 0", fontSize: 13, color: "var(--color-text-muted)" }}>หรือโอนผ่านบัญชีธนาคาร</p>
                                <p style={{ margin: 0, fontSize: 14 }}>ธนาคาร: {paymentInfo.bankName}</p>
                                <p style={{ margin: 0, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    เลขบัญชี: <strong>{paymentInfo.bankAccountNumber}</strong>
                                    <button
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(paymentInfo.bankAccountNumber)}
                                        style={{ padding: "2px 8px", fontSize: 12 }}
                                    >
                                        คัดลอก
                                    </button>
                                </p>
                                <p style={{ margin: 0, fontSize: 14 }}>ชื่อบัญชี: {paymentInfo.bankAccountName}</p>
                            </div>
                        )}

                        {!qrDataUrl && !hasBankInfo && (
                            <p style={{ fontSize: 13, color: "var(--color-warning)", marginBottom: 16 }}>
                                ร้านนี้ยังไม่ได้ตั้งค่าวิธีรับเงิน กรุณาติดต่อร้านโดยตรงผ่านเบอร์โทร/ไอจีที่หน้าร้าน
                            </p>
                        )}

                        <label htmlFor="slip-upload">แนบสลิปการโอนเงิน (จำเป็น)</label>
                        {slipPreview && (
                            <img src={slipPreview} alt="สลิป" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 8, display: "block" }} />
                        )}
                        <input id="slip-upload" type="file" accept="image/*" onChange={handleSlipFileChange} disabled={slipUploading} />
                        {slipUploading && <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>กำลังอัปโหลด...</p>}
                        {slipError && <p style={{ fontSize: 12, color: "var(--color-danger)" }}>{slipError}</p>}
                        {slipUrl && !slipUploading && <p style={{ fontSize: 12, color: "var(--color-success)" }}>✅ แนบสลิปแล้ว</p>}

                        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, margin: "10px 0" }}>{error}</p>}

                        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                            <button type="button" onClick={() => setStep(0)} disabled={submitting} style={{ flex: 1 }}>
                                ย้อนกลับ
                            </button>
                            <button
                                type="submit"
                                onClick={handleFinalConfirm}
                                disabled={submitting || !slipUrl || slipUploading}
                                style={{ flex: 1, justifyContent: "center" }}
                            >
                                {submitting ? "กำลังส่ง..." : "ยืนยันสั่งซื้อ"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}