// src/pages/public/ContactPage.jsx — สร้างตามโครงหน้า contact.html เดิม
import Icon from "../../components/ui/Icon";

const SKILLS = [
    { title: "Engineering", detail: "จุฬาลงกรณ์มหาวิทยาลัย" },
    { title: "Coding", detail: "HTML, C, C++, CSS, JS, Python" },
    { title: "Hackathon", detail: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี" },
    { title: "Ghost Board", detail: "กล่องผีสุ่มวิญญาณ" },
];

const CONTACTS = [
    { icon: "mail", label: "EMAIL", value: "nuttawatsumploy@gmail.com", href: "mailto:nuttawatsumploy@gmail.com" },
    { icon: "phone", label: "PHONE", value: "063-360-2605", href: "tel:0633602605" },
    { icon: "instagram", label: "INSTAGRAM", value: "@ko_kohang", href: "https://instagram.com/ko_kohang" },
    { icon: "facebook", label: "FACEBOOK", value: "Nuttawat Sumploy", href: "https://facebook.com/nuttavut.soomploy" },
];

export default function ContactPage() {
    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 16px" }}>
            {/* ---------- Intro ---------- */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <p style={{ color: "var(--color-primary)", fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                    Nuttawat Sumploy
                </p>
                <h1 style={{ marginBottom: 8 }}>Developer · Student · Dreamer</h1>
                <p style={{ color: "var(--color-text-muted)" }}>
                    สวัสดีครับ ผมชื่อณัฐวรรธ ม.5/7 โรงเรียนฤทธิยะวรรณาลัย
                </p>
                <p style={{ color: "var(--color-text-muted)" }}>
                    ผมเชื่อว่าเทคโนโลยีเปลี่ยนโลกได้ — จุดเริ่มต้นคือโปรเจกต์เล็กๆ สู่การสร้าง Rittiya Shop
                </p>
            </div>

            {/* ---------- Skills / Playground ---------- */}
            <h2 style={{ marginBottom: 16 }}>My Playground</h2>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    marginBottom: 40,
                }}
            >
                {SKILLS.map((skill) => (
                    <div key={skill.title} className="card" style={{ padding: 16 }}>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: 15 }}>{skill.title}</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>{skill.detail}</p>
                    </div>
                ))}
            </div>

            {/* ---------- Get in Touch ---------- */}
            <h2 style={{ marginBottom: 16 }}>Get in Touch</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {CONTACTS.map((c) => (
                    <a
                        key={c.label}
                        href={c.href}
                        target={c.href.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="card"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: 14,
                            color: "var(--color-text)",
                        }}
                    >
                        <Icon name={c.icon} size={20} />
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", letterSpacing: 1 }}>
                                {c.label}
                            </p>
                            <p style={{ margin: 0, fontSize: 14 }}>{c.value}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}