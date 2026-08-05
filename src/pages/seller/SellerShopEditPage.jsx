// src/pages/seller/SellerShopEditPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopsByOwner, updateShopInfo } from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";
import Icon from "../../components/ui/Icon";
import { THAI_BANKS } from "../../utils/banks";

export default function SellerShopEditPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // form fields
    const [name, setName] = useState("");
    const [slogan, setSlogan] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [phone, setPhone] = useState("");
    const [promptpayId, setPromptpayId] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [bankAccountName, setBankAccountName] = useState("");
    const [ig, setIg] = useState("");
    const [category, setCategory] = useState("");

    useEffect(() => {
        async function load() {
            const shops = await getShopsByOwner(user.uid);
            const myShop = shops[0] || null;
            setShop(myShop);
            if (myShop) {
                setName(myShop.name || "");
                setSlogan(myShop.slogan || "");
                setLogoUrl(myShop.logoUrl || "");
                setPhone(myShop.phone || "");
                setPromptpayId(myShop.promptpayId || "");
                setBankName(myShop.bankName || "");
                setBankAccountNumber(myShop.bankAccountNumber || "");
                setBankAccountName(myShop.bankAccountName || "");
                setIg(myShop.ig || "");
                setCategory(myShop.category || "");
            }
            setLoading(false);
        }
        load();
    }, [user]);

    async function handleSave(e) {
        e.preventDefault();

        if (!name.trim()) {
            showToast("กรุณากรอกชื่อร้าน", "error");
            return;
        }
        if (!phone.trim()) {
            showToast("กรุณากรอกเบอร์โทร", "error");
            return;
        }

        const hasPromptPay = !!promptpayId.trim();
        const hasSomeBankField = bankName || bankAccountNumber || bankAccountName;
        const hasCompleteBank = bankName && bankAccountNumber && bankAccountName;

        if (!hasPromptPay && !hasCompleteBank) {
            showToast(
                hasSomeBankField
                    ? "กรุณากรอกข้อมูลบัญชีธนาคารให้ครบทั้ง 3 ช่อง หรือกรอกเลขพร้อมเพย์แทน"
                    : "กรุณากรอกวิธีรับเงินอย่างน้อย 1 วิธี",
                "error"
            );
            return;
        }

        setSaving(true);
        try {
            await updateShopInfo(shop.id, {
                name: name.trim(),
                slogan: slogan.trim(),
                logoUrl,
                phone: phone.trim(),
                promptpayId: promptpayId.trim(),
                bankName,
                bankAccountNumber: bankAccountNumber.trim(),
                bankAccountName: bankAccountName.trim(),
                ig: ig.trim(),
                category: category.trim(),
            });
            showToast("บันทึกข้อมูลร้านสำเร็จ", "success");
            navigate("/seller/dashboard");
        } catch (err) {
            console.error("อัปเดตข้อมูลร้านไม่สำเร็จ:", err);
            showToast("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง", "error");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px" }}>
            <button
                type="button"
                onClick={() => navigate("/seller/dashboard")}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 12, color: "var(--color-primary)" }}
            >
                <Icon name="arrow-left" size={16} /> กลับแดชบอร์ด
            </button>

            <h2>แก้ไขข้อมูลร้าน</h2>

            <form onSubmit={handleSave}>
                <label htmlFor="edit-name">ชื่อร้าน *</label>
                <input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <label htmlFor="edit-slogan">สโลแกน</label>
                <input
                    id="edit-slogan"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                />

                <ImageUploadField label="โลโก้ร้าน" value={logoUrl} onChange={setLogoUrl} />

                <label htmlFor="edit-phone">เบอร์โทร *</label>
                <input
                    id="edit-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />
                <h4 style={{ marginBottom: 4 }}>วิธีรับเงิน (กรอกอย่างน้อย 1 วิธี)</h4>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 10 }}>
                    กรอกได้ทั้งคู่ถ้ามี — ลูกค้าจะเห็นทุกวิธีที่กรอกไว้ตอนจ่ายเงิน
                </p>

                <label htmlFor="edit-promptpay">เลขพร้อมเพย์ (ไม่บังคับ)</label>
                <input
                    id="edit-promptpay"
                    value={promptpayId}
                    onChange={(e) => setPromptpayId(e.target.value)}
                    placeholder="เบอร์โทรหรือเลขบัตรประชาชนที่ผูกพร้อมเพย์แล้วเท่านั้น"
                    style={{ display: "block", width: "100%", marginBottom: 12 }}
                />

                <label htmlFor="edit-bank-name">ธนาคาร (ไม่บังคับ)</label>
                <select
                    id="edit-bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                >
                    <option value="">-- เลือกธนาคาร --</option>
                    {THAI_BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                    ))}
                </select>

                <label htmlFor="edit-bank-account-number">เลขบัญชี</label>
                <input
                    id="edit-bank-account-number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                />

                <label htmlFor="edit-bank-account-name">ชื่อบัญชี</label>
                <input
                    id="edit-bank-account-name"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                />

                <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />

                <label htmlFor="edit-ig">ไอจี (ไม่บังคับ)</label>
                <input
                    id="edit-ig"
                    value={ig}
                    onChange={(e) => setIg(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                />

                <label htmlFor="edit-category">หมวดหมู่</label>
                <input
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="เช่น อาหาร, เครื่องดื่ม, ของใช้"
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                />

                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                    <button type="button" onClick={() => navigate("/seller/dashboard")}>
                        ยกเลิก
                    </button>
                    <button type="submit" disabled={saving}>
                        {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                </div>
            </form>
        </div>
    );
}
