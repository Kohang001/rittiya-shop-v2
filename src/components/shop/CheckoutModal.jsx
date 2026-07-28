// src/components/shop/CheckoutModal.jsx — อัปเดต: แสดง QR PromptPay อัตโนมัติหลังสั่งซื้อสำเร็จ
import { useState } from "react";
import { generatePromptPayQR } from "../../utils/promptpay";

export default function CheckoutModal({ items, total, promptpayTarget, onConfirm, onClose }) {
    const [customerName, setCustomerName] = useState("");
    const [customerContact, setCustomerContact] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successData, setSuccessData] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [qrError, setQrError] = useState("");

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

            if (promptpayTarget) {
                try {
                    const dataUrl = await generatePromptPayQR(promptpayTarget, result.total);
                    setQrDataUrl(dataUrl);
                } catch (qrErr) {
                    console.error("สร้าง QR ไม่สำเร็จ:", qrErr);
                    setQrError("สร้าง QR อัตโนมัติไม่สำเร็จ — โอนเงินตามเบอร์พร้อมเพย์ของร้านแทนได้");
                }
            }
        } catch (err) {
            setError(err.message || "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSubmitting(false);
        }
    }

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
                                <img
                                    src={qrDataUrl}
                                    alt="PromptPay QR Code"
                                    style={{ width: 220, height: 220, margin: "0 auto", display: "block" }}
                                />
                                <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8 }}>
                                    สแกนจ่ายผ่านพร้อมเพย์ ({promptpayTarget})
                                </p>
                            </div>
                        )}
                        {qrError && <p style={{ fontSize: 13, color: "var(--color-danger)" }}>{qrError}</p>}

                        <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                            ทางร้านจะได้รับแจ้งเตือนและติดต่อกลับหาคุณผ่านช่องทางที่ให้ไว้
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
                                <div
                                    key={product.id}
                                    style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}
                                >
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