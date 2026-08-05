// src/components/ui/ConfirmModal.jsx
// ใช้แทน confirm() ทุกจุด — แสดง modal สวยๆ พร้อม animation
export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
                <p style={{ margin: "0 0 20px 0", fontSize: 15, lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" onClick={onCancel}>
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            background: "var(--color-danger)",
                            borderColor: "var(--color-danger)",
                            color: "#fff",
                        }}
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
}
