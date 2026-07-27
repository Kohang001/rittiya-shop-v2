// src/components/layout/Footer.jsx
export default function Footer() {
    return (
        <footer
            style={{
                borderTop: "1px solid var(--color-border)",
                padding: "20px 16px",
                marginTop: 40,
                textAlign: "center",
                fontSize: 13,
                color: "var(--color-text-muted)",
            }}
        >
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} Rittiya Shop. All rights reserved.</p>
            <p style={{ margin: "2px 0 0 0" }}>Developed by Nuttawat Sumploy</p>
        </footer>
    );
}