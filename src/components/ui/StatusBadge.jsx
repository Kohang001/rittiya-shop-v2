// src/components/ui/StatusBadge.jsx
// Bespoke Vector Status Indicators (Zero-Emoji, Pulse Animations)
import React from "react";
import Icon from "./Icon";

export default function StatusBadge({ status, text, size = "md", className = "" }) {
    if (status === "open" || status === true) {
        return (
            <span className={`status-pill status-pill--open status-pill--${size} ${className}`}>
                <span className="pulse-dot pulse-dot--success" aria-hidden="true" />
                <span className="status-pill__text">{text || "เปิดรับออเดอร์"}</span>
            </span>
        );
    }

    if (status === "closed" || status === false) {
        return (
            <span className={`status-pill status-pill--closed status-pill--${size} ${className}`}>
                <span className="pulse-dot pulse-dot--warning" aria-hidden="true" />
                <span className="status-pill__text">{text || "ปิดรับออเดอร์ชั่วคราว"}</span>
            </span>
        );
    }

    if (status === "approved") {
        return (
            <span className={`status-pill status-pill--approved status-pill--${size} ${className}`}>
                <Icon name="check" size={size === "sm" ? 12 : 14} color="var(--status-success)" />
                <span className="status-pill__text">{text || "อนุมัติแล้ว"}</span>
            </span>
        );
    }

    if (status === "rejected") {
        return (
            <span className={`status-pill status-pill--rejected status-pill--${size} ${className}`}>
                <Icon name="x" size={size === "sm" ? 12 : 14} color="var(--status-danger)" />
                <span className="status-pill__text">{text || "ไม่อนุมัติ"}</span>
            </span>
        );
    }

    if (status === "pending") {
        return (
            <span className={`status-pill status-pill--pending status-pill--${size} ${className}`}>
                <span className="pulse-dot pulse-dot--amber" aria-hidden="true" />
                <span className="status-pill__text">{text || "รอตรวจสอบ"}</span>
            </span>
        );
    }

    return (
        <span className={`status-pill status-pill--default status-pill--${size} ${className}`}>
            <span className="status-pill__text">{text || status}</span>
        </span>
    );
}

