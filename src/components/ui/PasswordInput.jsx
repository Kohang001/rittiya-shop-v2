// src/components/ui/PasswordInput.jsx
import { useState } from "react";
import Icon from "./Icon";

/**
 * Input รหัสผ่านพร้อมปุ่มเปิด/ปิดการมองเห็น ใช้แทน <input type="password"> เดี่ยวๆ ทุกที่
 */
export default function PasswordInput({ id, value, onChange, required, minLength, ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <div style={{ position: "relative" }}>
            <input
                id={id}
                type={visible ? "text" : "password"}
                value={value}
                onChange={onChange}
                required={required}
                minLength={minLength}
                style={{ display: "block", width: "100%", paddingRight: 40 }}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    padding: 6,
                }}
            >
                <Icon name={visible ? "eye-off" : "eye"} size={16} />
            </button>
        </div>
    );
}