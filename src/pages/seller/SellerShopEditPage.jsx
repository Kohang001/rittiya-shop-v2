// src/pages/seller/SellerShopEditPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopsByOwner, updateShopInfo } from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";
import Icon from "../../components/ui/Icon";
import { THAI_BANKS } from "../../utils/banks";
import { validateFields } from "../../utils/contentFilter";
import {
    isValidPhone,
    isValidPromptPay,
    isValidBankAccountNumber,
} from "../../utils/validators";
import PageSkeleton from "../../components/ui/PageSkeleton";

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

        const trimmedCategory = category.trim();
        if (!trimmedCategory) {
            showToast("กรุณาระบุหมวดหมู่ร้านค้า", "error");
            return;
        }

        const trimmedPhone = phone.trim();
        if (!isValidPhone(trimmedPhone)) {
            showToast("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักพอดี (เช่น 0812345678)", "error");
            return;
        }

        const trimmedPromptPay = promptpayId.trim();
        const hasPromptPay = !!trimmedPromptPay;
        if (hasPromptPay && !isValidPromptPay(trimmedPromptPay)) {
            showToast("เลขพร้อมเพย์ต้องเป็นตัวเลข 10 หลัก หรือ 13 หลักเท่านั้น", "error");
            return;
        }

        const trimmedBankNum = bankAccountNumber.trim();
        const trimmedBankName = bankAccountName.trim();
        const hasSomeBankField = bankName || trimmedBankNum || trimmedBankName;
        const hasCompleteBank = bankName && trimmedBankNum && trimmedBankName;

        if (hasSomeBankField && !hasCompleteBank) {
            showToast("กรุณากรอกข้อมูลบัญชีธนาคารให้ครบทั้ง 3 ช่อง (ธนาคาร/เลขบัญชี/ชื่อบัญชี)", "error");
            return;
        }

        if (trimmedBankNum && !isValidBankAccountNumber(trimmedBankNum)) {
            showToast("เลขที่บัญชีธนาคารต้องเป็นตัวเลข 10 ถึง 12 หลักเท่านั้น", "error");
            return;
        }

        if (!hasPromptPay && !hasCompleteBank) {
            showToast("กรุณากรอกวิธีรับเงินอย่างน้อย 1 วิธี: เลขพร้อมเพย์ หรือ บัญชีธนาคาร", "error");
            return;
        }

        const contentCheck = validateFields([
            { label: "ชื่อร้าน", value: name.trim() },
            { label: "คำอธิบายร้าน (สโลแกน)", value: slogan.trim() },
            { label: "หมวดหมู่ร้านค้า", value: trimmedCategory },
            { label: "ชื่อบัญชีธนาคาร", value: trimmedBankName },
        ]);
        if (!contentCheck.isValid) {
            showToast(contentCheck.error, "error");
            return;
        }

        setSaving(true);
        try {
            await updateShopInfo(shop.id, {
                name: name.trim(),
                slogan: slogan.trim(),
                logoUrl,
                phone: trimmedPhone,
                promptpayId: trimmedPromptPay,
                bankName,
                bankAccountNumber: trimmedBankNum,
                bankAccountName: trimmedBankName,
                ig: ig.trim(),
                category: trimmedCategory,
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

    if (loading) return <PageSkeleton lines={6} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px" }}>
            <button
                type="button"
                onClick={() => navigate("/seller/dashboard")}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 0,
                    marginBottom: 16,
                    color: "var(--color-primary)",
                    fontSize: 14,
                    fontWeight: 500,
                }}
            >
                <Icon name="arrow-left" size={16} color="var(--color-primary)" /> กลับแดชบอร์ด
            </button>

            <h2 style={{ fontSize: "clamp(20px, 4vw, 24px)", marginBottom: 16 }}>แก้ไขข้อมูลร้านค้า</h2>

            <form onSubmit={handleSave}>
                <label htmlFor="edit-name" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                    ชื่อร้าน *
                </label>
                <input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                    required
                />

                <label htmlFor="edit-category" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                    หมวดหมู่ร้านค้า *
                </label>
                <input
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="เช่น อาหาร, เครื่องดื่ม, ของใช้"
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                    required
                />

                <label htmlFor="edit-slogan" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                    สโลแกน / คำอธิบายร้าน
                </label>
                <input
                    id="edit-slogan"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />

                <ImageUploadField label="โลโก้ร้าน" value={logoUrl} onChange={setLogoUrl} />

                <label htmlFor="edit-phone" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                    เบอร์โทรติดต่อ * <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(10 หลัก)</span>
                </label>
                <input
                    id="edit-phone"
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{ display: "block", width: "100%", marginBottom: 16 }}
                    required
                />

                <div
                    style={{
                        padding: 16,
                        background: "var(--color-bg-subtle)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        marginBottom: 16,
                    }}
                >
                    <h4 style={{ margin: "0 0 4px 0", fontSize: 14 }}>วิธีรับเงิน (กรอกอย่างน้อย 1 วิธี)</h4>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px 0" }}>
                        ลูกค้าจะเห็นวิธีที่กรอกไว้ตอนจ่ายเงิน (สามารถกรอกได้ทั้งสองวิธี)
                    </p>

                    <label htmlFor="edit-promptpay" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                        เลขพร้อมเพย์ <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(10 หรือ 13 หลัก)</span>
                    </label>
                    <input
                        id="edit-promptpay"
                        type="tel"
                        maxLength={13}
                        value={promptpayId}
                        onChange={(e) => setPromptpayId(e.target.value.replace(/\D/g, "").slice(0, 13))}
                        placeholder="เบอร์โทร 10 หลัก หรือบัตรประชาชน 13 หลัก"
                        style={{ display: "block", width: "100%", marginBottom: 12 }}
                    />

                    <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: 12, marginTop: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                            หรือรับผ่านบัญชีธนาคาร (ครบ 3 ช่อง)
                        </span>

                        <label htmlFor="edit-bank-name" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            ธนาคาร
                        </label>
                        <select
                            id="edit-bank-name"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                        >
                            <option value="">-- เลือกธนาคาร --</option>
                            {THAI_BANKS.map((bank) => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>

                        <label htmlFor="edit-bank-account-number" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            เลขบัญชี <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(ตัวเลข 10-12 หลัก)</span>
                        </label>
                        <input
                            id="edit-bank-account-number"
                            type="tel"
                            maxLength={12}
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                            placeholder="ระบุตัวเลข 10-12 หลัก"
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                        />

                        <label htmlFor="edit-bank-account-name" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            ชื่อบัญชี
                        </label>
                        <input
                            id="edit-bank-account-name"
                            value={bankAccountName}
                            onChange={(e) => setBankAccountName(e.target.value)}
                            placeholder="ชื่อและนามสกุลตรงตามบัญชี"
                            style={{ display: "block", width: "100%", marginBottom: 4 }}
                        />
                    </div>
                </div>

                <label htmlFor="edit-ig" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                    ไอจีร้าน (ไม่บังคับ)
                </label>
                <input
                    id="edit-ig"
                    value={ig}
                    onChange={(e) => setIg(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 16 }}
                />

                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                    <button
                        type="button"
                        onClick={() => navigate("/seller/dashboard")}
                        style={{
                            flex: 1,
                            padding: "10px 16px",
                            background: "var(--color-bg-subtle)",
                            color: "var(--color-text)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 500,
                        }}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            flex: 2,
                            padding: "10px 16px",
                            background: "var(--color-primary)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                        }}
                    >
                        {saving ? (
                            <>
                                <Icon name="sparkle" size={16} color="#fff" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Icon name="check" size={16} color="#fff" />
                                บันทึกข้อมูล
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
