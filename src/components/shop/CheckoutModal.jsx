// src/components/shop/CheckoutModal.jsx — อัปเดต: โชว์ PromptPay QR และ/หรือบัญชีธนาคาร + อัปโหลดสลิป
import { useState } from "react";
import { generatePromptPayQR } from "../../utils/promptpay";
import { uploadImage } from "../../cloudinary/upload";
import { validateImageFile } from "../../utils/validators";

export default function CheckoutModal({ shopId, items, total, onConfirm, onClose }) {
    const [customerName, setCustomerName] = useState("");
    const [customerContact, setCustomerContact] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successData, setSuccessData] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);

    const [slipUploading, setSlipUploading] = useState(false);
    const [slipError, setSlipError] = useState("");
    const [slipSent, setSlipSent] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!customerName.trim() || !customerContact.trim()) {
            setError("กรุณากรอกชื่อและช่องทางติดต่อให้ครบ");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const result = await onConfirm({ customerName, customerContact });
            setSuccessData(result);

            const promptpayId = result.paymentInfo?.promptpayId;
            if (promptpayId) {
                try {
                    const dataUrl = await generatePromptPayQR(promptpayId, result.total);
                    setQrDataUrl(dataUrl);
                } catch (qrErr) {
                    console.error("สร้าง QR ไม่สำเร็จ:", qrErr);
                }
            }
        } catch (err) {
            setError(err.message || "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSlipUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const check = validateImageFile(file);
        if (!check.valid) {
            setSlipError(check.error);
            return;
        }

        setSlipError("");
        setSlipUploading(true);
        try {
            const slipUrl = await uploadImage(file);
            const res = await fetch("/api/uploadSlip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId, orderId: successData.orderId, slipUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "ส่งสลิปไม่สำเร็จ");
            setSlipSent(true);
        } catch (err) {
            setSlipError(err.message || "ส่งสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSlipUploading(false);
        }
    }

    const bank = successData?.paymentInfo;
    const hasBankInfo = bank?.bankName && bank?.bankAccountNumber && bank?.bankAccountName;

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
                {successData ? (
                    <div style={{ textAlign: "center" }}>
                        <h2 id="checkout-modal-title">สั่งซื้อสำเร็จ</h2>
                        <p style={{ color: "var(--color-text-muted)" }}>
                            ยอดรวม <strong>{successData.total.toLocaleString()} บาท</strong>
                        </p>

                        {qrDataUrl && (
                            <div style={{ margin: "16px 0" }}>
                                <img src={qrDataUrl} alt="PromptPay QR Code" style={{ width: 200, height: 200, margin: "0 auto", display: "block" }} />
                                <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8 }}>
                                    สแกนจ่ายผ่านพร้อมเพย์
                                </p>
                            </div>
                        )}

                        {hasBankInfo && (
                            <div className="card" style={{ padding: 14, margin: "16px 0", textAlign: "left" }}>
                                <p style={{ margin: "0 0 4px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                                    หรือโอนผ่านบัญชีธนาคาร
                                </p>
                                <p style={{ margin: 0, fontSize: 14 }}>ธนาคาร: {bank.bankName}</p>
                                <p style={{ margin: 0, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    เลขบัญชี: <strong>{bank.bankAccountNumber}</strong>
                                    <button
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(bank.bankAccountNumber)}
                                        style={{ padding: "2px 8px", fontSize: 12 }}
                                    >
                                        คัดลอก
                                    </button>
                                </p>
                                <p style={{ margin: 0, fontSize: 14 }}>ชื่อบัญชี: {bank.bankAccountName}</p>
                            </div>
                        )}

                        {/* ---------- อัปโหลดสลิป ---------- */}
                        {!slipSent ? (
                            <div style={{ marginTop: 16, textAlign: "left" }}>
                                <label htmlFor="slip-upload">แนบสลิปการโอนเงิน (เพื่อให้ร้านตรวจสอบเร็วขึ้น)</label>
                                <input id="slip-upload" type="file" accept="image/*" onChange={handleSlipUpload} disabled={slipUploading} />
                                {slipUploading && <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>กำลังส่งสลิป...</p>}
                                {slipError && <p style={{ fontSize: 12, color: "var(--color-danger)" }}>{slipError}</p>}
                            </div>
                        ) : (
                            <p style={{ color: "var(--color-success)", fontSize: 14, marginTop: 16 }}>
                                ✅ ส่งสลิปให้ร้านแล้ว รอร้านตรวจสอบและยืนยัน
                            </p>
                        )}

                        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 16 }}>
                            ทางร้านจะติดต่อกลับหาคุณผ่านช่องทางที่ให้ไว้หลังตรวจสอบยอดโอนแล้ว
                        </p>
                        <button type="submit" onClick={onClose} style={{ width: "100%", marginTop: 12 }}>
                            ปิดหน้าต่างนี้
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
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

                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={onClose} disabled={submitting} style={{ flex: 1 }}>
                                ยกเลิก
                            </button>
                            <button type="submit" disabled={submitting} style={{ flex: 1, justifyContent: "center" }}>
                                {submitting ? "กำลังส่ง..." : "ยืนยันสั่งซื้อ"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}