// src/pages/seller/SellerRegisterPage.jsx
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../firebase/auth";
import { createShopDraft, addProduct } from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";
import DynamicProductFieldList from "../../components/form/DynamicProductFieldList";
import PasswordInput from "../../components/ui/PasswordInput";
import Icon from "../../components/ui/Icon";
import { THAI_BANKS } from "../../utils/banks";
import { validateFields } from "../../utils/contentFilter";
import {
    isValidPhone,
    isValidPromptPay,
    isValidBankAccountNumber,
    isValidPrice,
} from "../../utils/validators";

const STEPS = ["บัญชีผู้ใช้", "ข้อมูลร้านค้า", "สินค้า"];

export default function SellerRegisterPage() {
    const [step, setStep] = useState(0);
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const hasSubmittedRef = useRef(false);
    const navigate = useNavigate();

    const {
        register,
        control,
        watch,
        setValue,
        trigger,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            name: "",
            slogan: "",
            logoUrl: "",
            phone: "",
            promptpayId: "",
            bankName: "",
            bankAccountNumber: "",
            bankAccountName: "",
            ig: "",
            category: "",
            products: [],
        },
    });

    async function goNext() {
        setSubmitError("");
        let fieldsToValidate = [];
        if (step === 0) fieldsToValidate = ["email", "password", "confirmPassword"];
        if (step === 1) fieldsToValidate = ["name", "phone", "category"];

        const valid = await trigger(fieldsToValidate);
        if (!valid) return;

        if (step === 0) {
            const password = watch("password");
            const confirmPassword = watch("confirmPassword");
            if (password !== confirmPassword) {
                setSubmitError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
                return;
            }
            if (password.length < 6) {
                setSubmitError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
                return;
            }
        }

        if (step === 1) {
            const phone = (watch("phone") || "").trim();
            if (!isValidPhone(phone)) {
                setSubmitError("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักพอดี (เช่น 0812345678)");
                return;
            }

            const category = (watch("category") || "").trim();
            if (!category) {
                setSubmitError("กรุณาระบุหมวดหมู่ร้านค้า (เช่น อาหาร, เครื่องดื่ม, ของใช้)");
                return;
            }

            const promptpay = (watch("promptpayId") || "").trim();
            const hasPromptPay = !!promptpay;
            if (hasPromptPay && !isValidPromptPay(promptpay)) {
                setSubmitError("เลขพร้อมเพย์ต้องเป็นตัวเลข 10 หลัก (เบอร์โทร) หรือ 13 หลัก (บัตรประชาชน) เท่านั้น");
                return;
            }

            const bankName = (watch("bankName") || "").trim();
            const bankAccountNumber = (watch("bankAccountNumber") || "").trim();
            const bankAccountName = (watch("bankAccountName") || "").trim();
            const hasSomeBankField = bankName || bankAccountNumber || bankAccountName;
            const hasCompleteBank = bankName && bankAccountNumber && bankAccountName;

            if (hasSomeBankField && !hasCompleteBank) {
                setSubmitError("กรุณากรอกข้อมูลบัญชีธนาคารให้ครบทั้ง 3 ช่อง (ธนาคาร / เลขบัญชี / ชื่อบัญชี)");
                return;
            }

            if (bankAccountNumber && !isValidBankAccountNumber(bankAccountNumber)) {
                setSubmitError("เลขที่บัญชีธนาคารต้องเป็นตัวเลข 10 ถึง 12 หลักเท่านั้น");
                return;
            }

            if (!hasPromptPay && !hasCompleteBank) {
                setSubmitError("กรุณากรอกวิธีรับเงินอย่างน้อย 1 วิธี: เลขพร้อมเพย์ หรือ ข้อมูลบัญชีธนาคารให้ครบถ้วน");
                return;
            }

            // ตรวจสอบคำไม่เหมาะสมในข้อมูลร้านค้าและบัญชี
            const contentCheck = validateFields([
                { label: "ชื่อร้านค้า", value: watch("name") },
                { label: "คำอธิบายร้านค้า (สโลแกน)", value: watch("slogan") },
                { label: "หมวดหมู่ร้านค้า", value: category },
                { label: "ชื่อบัญชีธนาคาร", value: bankAccountName },
            ]);
            if (!contentCheck.isValid) {
                setSubmitError(contentCheck.error);
                return;
            }
        }

        setSubmitError("");
        setStep((s) => s + 1);
    }

    function goBack() {
        setSubmitError("");
        setStep((s) => s - 1);
    }

    async function onSubmit(data) {
        if (hasSubmittedRef.current) return;
        setSubmitError("");

        // 1. ตรวจสอบขั้นตอนที่ 1 (ข้อมูลร้านค้า) อีกครั้งเพื่อความปลอดภัย
        const phone = (data.phone || "").trim();
        if (!isValidPhone(phone)) {
            setSubmitError("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักพอดี (เช่น 0812345678)");
            setStep(1);
            return;
        }

        const category = (data.category || "").trim();
        if (!category) {
            setSubmitError("กรุณาระบุหมวดหมู่ร้านค้า");
            setStep(1);
            return;
        }

        const promptpay = (data.promptpayId || "").trim();
        if (promptpay && !isValidPromptPay(promptpay)) {
            setSubmitError("เลขพร้อมเพย์ต้องเป็นตัวเลข 10 หลัก หรือ 13 หลักเท่านั้น");
            setStep(1);
            return;
        }

        const bankName = (data.bankName || "").trim();
        const bankAccountNumber = (data.bankAccountNumber || "").trim();
        const bankAccountName = (data.bankAccountName || "").trim();
        const hasSomeBank = bankName || bankAccountNumber || bankAccountName;
        const hasCompleteBank = bankName && bankAccountNumber && bankAccountName;

        if (hasSomeBank && !hasCompleteBank) {
            setSubmitError("กรุณากรอกข้อมูลบัญชีธนาคารให้ครบทั้ง 3 ช่อง");
            setStep(1);
            return;
        }

        if (bankAccountNumber && !isValidBankAccountNumber(bankAccountNumber)) {
            setSubmitError("เลขที่บัญชีธนาคารต้องเป็นตัวเลข 10 ถึง 12 หลักเท่านั้น");
            setStep(1);
            return;
        }

        if (!promptpay && !hasCompleteBank) {
            setSubmitError("กรุณากรอกวิธีรับเงินอย่างน้อย 1 วิธี: เลขพร้อมเพย์ หรือ ข้อมูลบัญชีธนาคาร");
            setStep(1);
            return;
        }

        // 2. ตรวจสอบสินค้า (ขั้นตอนที่ 2)
        if (!data.products || data.products.length === 0) {
            setSubmitError("กรุณาเพิ่มสินค้าอย่างน้อย 1 ชิ้นก่อนสมัครร้าน");
            setStep(2);
            return;
        }

        // ตรวจสอบราคาสินค้าทุกชิ้นว่าต้อง >= 1 บาท
        for (let i = 0; i < data.products.length; i++) {
            const prod = data.products[i];
            const pName = prod.name?.trim() || `สินค้าชิ้นที่ ${i + 1}`;
            if (!prod.name || !prod.name.trim()) {
                setSubmitError(`กรุณาระบุชื่อสินค้าสำหรับชิ้นที่ ${i + 1}`);
                setStep(2);
                return;
            }

            if (!isValidPrice(prod.price)) {
                setSubmitError(`สินค้ารายการ "${pName}" ต้องระบุราคาตั้งแต่ 1 บาทขึ้นไป (ไม่อนุญาตให้ใส่ราคา 0 บาทหรือติดลบ)`);
                setStep(2);
                return;
            }
        }

        // 3. ตรวจสอบคำต้องห้าม/คำไม่เหมาะสม ทั้งหมดก่อนสร้างบัญชีเด็ดขาด
        const fieldsToCheck = [
            { label: "ชื่อร้านค้า", value: data.name },
            { label: "คำอธิบายร้านค้า (สโลแกน)", value: data.slogan },
            { label: "หมวดหมู่ร้านค้า", value: category },
            { label: "ชื่อบัญชีธนาคาร", value: bankAccountName },
            ...(data.products || []).flatMap((p, idx) => [
                { label: `ชื่อสินค้าลำดับที่ ${idx + 1} (${p.name || "ไม่มีชื่อ"})`, value: p.name },
                { label: `คำอธิบายสินค้าลำดับที่ ${idx + 1}`, value: p.desc },
            ]),
        ];

        const contentCheck = validateFields(fieldsToCheck);
        if (!contentCheck.isValid) {
            setSubmitError(contentCheck.error);
            return;
        }

        // เมื่อผ่านทุกการตรวจสอบ จึงเริ่มต้นบันทึกข้อมูล
        hasSubmittedRef.current = true;
        setSubmitting(true);

        let createdUser = null;

        try {
            // สร้าง Auth User ใน Firebase
            const { user, error: authError } = await registerUser(data.email, data.password);
            if (authError) {
                setSubmitError(authError);
                setSubmitting(false);
                hasSubmittedRef.current = false;
                setStep(0);
                return;
            }

            createdUser = user;

            // บันทึกข้อมูลร้านค้า (createShopDraft จะเซ็ต status เป็น approved อัตโนมัติ)
            const { id: shopId, lineLinkCode } = await createShopDraft({
                ownerUid: user.uid,
                name: data.name.trim(),
                slogan: (data.slogan || "").trim(),
                logoUrl: data.logoUrl || "",
                phone: phone,
                promptpayId: promptpay,
                bankName: bankName,
                bankAccountNumber: bankAccountNumber,
                bankAccountName: bankAccountName,
                ig: (data.ig || "").trim(),
                category: category,
            });

            // แจ้งเตือนระบบ Admin เบื้องหลัง (ไม่บล็อกการทำงาน)
            fetch("/api/notifyNewShop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId }),
            }).catch((err) => console.warn("แจ้งเตือน Admin ไม่สำเร็จ (ไม่กระทบการเปิดร้าน):", err));

            // เพิ่มรายการสินค้าทั้งหมด
            for (const product of data.products) {
                await addProduct(shopId, {
                    name: product.name.trim(),
                    desc: (product.desc || "").trim(),
                    price: parseFloat(product.price) || 1,
                    imageUrl: product.imageUrl || "",
                });
            }

            navigate("/seller/pending-approval", { state: { lineLinkCode } });
        } catch (err) {
            console.error("Seller registration failure:", err);

            // Rollback: ถ้าสร้าง Auth User ไปแล้วแต่ Firestore ล้มเหลว ให้ลบ Auth User ทิ้งทันที
            // เพื่อไม่ให้ค้างในระบบ และเพื่อให้อีเมลนี้สามารถนำกลับมาสมัครใหม่ได้ทันที
            if (createdUser) {
                try {
                    await createdUser.delete();
                    console.log("Rolled back created Firebase Auth user successfully.");
                } catch (rollbackErr) {
                    console.error("Failed to delete user during rollback:", rollbackErr);
                }
            }

            setSubmitError(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message || "กรุณาลองใหม่อีกครั้ง"} (ระบบได้ยกเลิกบัญชีเดิมเพื่อให้อีเมลนี้สามารถลองใหม่ได้ทันที)`);
            hasSubmittedRef.current = false;
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: 540, margin: "32px auto", padding: "0 16px" }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 24px)", marginBottom: 16 }}>สมัครเปิดร้านค้า</h2>

            {/* Stepper Header */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {STEPS.map((label, i) => (
                    <div
                        key={label}
                        style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "8px 4px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 12,
                            fontWeight: 600,
                            background: i === step ? "var(--color-primary)" : "var(--color-bg-subtle)",
                            color: i === step ? "#fff" : "var(--color-text-muted)",
                            border: i === step ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {i + 1}. {label}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* STEP 0: บัญชีผู้ใช้ */}
                {step === 0 && (
                    <div>
                        <label htmlFor="reg-email" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            อีเมลสำหรับเข้าสู่ระบบ *
                        </label>
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="example@email.com"
                            {...register("email", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 12 }}
                        />
                        {errors.email && <p style={{ color: "var(--color-danger)", fontSize: 12, marginTop: -8, marginBottom: 8 }}>กรุณากรอกอีเมล</p>}

                        <label htmlFor="reg-password" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *
                        </label>
                        <div style={{ marginBottom: 12 }}>
                            <PasswordInput
                                id="reg-password"
                                placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                                {...register("password", { required: true, minLength: 6 })}
                            />
                        </div>
                        {errors.password && (
                            <p style={{ color: "var(--color-danger)", fontSize: 12, marginTop: -8, marginBottom: 8 }}>รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
                        )}

                        <label htmlFor="reg-confirm-password" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            ยืนยันรหัสผ่าน *
                        </label>
                        <div style={{ marginBottom: 12 }}>
                            <PasswordInput
                                id="reg-confirm-password"
                                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                                {...register("confirmPassword", { required: true })}
                            />
                        </div>
                    </div>
                )}

                {/* STEP 1: ข้อมูลร้านค้า */}
                {step === 1 && (
                    <div>
                        <label htmlFor="reg-shop-name" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            ชื่อร้าน *
                        </label>
                        <input
                            id="reg-shop-name"
                            placeholder="เช่น ครัวป้าแดง, Milk & Co."
                            {...register("name", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                        />
                        {errors.name && <p style={{ color: "var(--color-danger)", fontSize: 12, marginTop: -8, marginBottom: 8 }}>กรุณากรอกชื่อร้าน</p>}

                        <label htmlFor="reg-category" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            หมวดหมู่ร้านค้า * <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(จำเป็นต้องระบุ)</span>
                        </label>
                        <input
                            id="reg-category"
                            placeholder="เช่น อาหาร, เครื่องดื่ม, เบเกอรี่, ของใช้"
                            {...register("category", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                        />
                        {errors.category && <p style={{ color: "var(--color-danger)", fontSize: 12, marginTop: -8, marginBottom: 8 }}>กรุณาระบุหมวดหมู่ร้านค้า</p>}

                        <label htmlFor="reg-slogan" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            สโลแกน / คำอธิบายร้าน
                        </label>
                        <input
                            id="reg-slogan"
                            placeholder="เช่น อร่อย สะอาด ทำสดใหม่ทุกวัน"
                            {...register("slogan")}
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                        />

                        <ImageUploadField
                            label="โลโก้ร้าน"
                            value={watch("logoUrl")}
                            onChange={(url) => setValue("logoUrl", url)}
                        />

                        <label htmlFor="reg-phone" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            เบอร์โทรติดต่อ * <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(ตัวเลข 10 หลัก)</span>
                        </label>
                        <input
                            id="reg-phone"
                            type="tel"
                            maxLength={10}
                            placeholder="เช่น 0812345678"
                            value={watch("phone") || ""}
                            onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setValue("phone", digitsOnly, { shouldValidate: true });
                            }}
                            style={{ display: "block", width: "100%", marginBottom: 10 }}
                        />
                        {errors.phone && <p style={{ color: "var(--color-danger)", fontSize: 12, marginTop: -8, marginBottom: 8 }}>กรุณากรอกเบอร์โทร 10 หลัก</p>}

                        <label htmlFor="reg-ig" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                            Instagram ร้าน (ไม่บังคับ)
                        </label>
                        <input
                            id="reg-ig"
                            placeholder="เช่น @shop_name"
                            {...register("ig")}
                            style={{ display: "block", width: "100%", marginBottom: 16 }}
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
                            <h4 style={{ margin: "0 0 6px 0", fontSize: 14 }}>วิธีรับเงิน (กรอกอย่างน้อย 1 วิธี)</h4>
                            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px 0" }}>
                                ลูกค้าจะเห็นวิธีที่กรอกไว้ตอนจ่ายเงิน (สามารถกรอกทั้งสองแบบได้)
                            </p>

                            <label htmlFor="reg-promptpay" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                                เลขพร้อมเพย์ <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก)</span>
                            </label>
                            <input
                                id="reg-promptpay"
                                type="tel"
                                maxLength={13}
                                placeholder="เบอร์โทร 10 หลัก หรือบัตรประชาชน 13 หลัก"
                                value={watch("promptpayId") || ""}
                                onChange={(e) => {
                                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 13);
                                    setValue("promptpayId", digitsOnly);
                                }}
                                style={{ display: "block", width: "100%", marginBottom: 12 }}
                            />

                            <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: 12, marginTop: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                                    หรือรับผ่านบัญชีธนาคาร (หากเลือก ต้องกรอกครบทั้ง 3 ช่อง)
                                </span>

                                <label htmlFor="reg-bank-name" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                                    ธนาคาร
                                </label>
                                <select
                                    id="reg-bank-name"
                                    {...register("bankName")}
                                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                                >
                                    <option value="">-- เลือกธนาคาร --</option>
                                    {THAI_BANKS.map((bank) => (
                                        <option key={bank} value={bank}>
                                            {bank}
                                        </option>
                                    ))}
                                </select>

                                <label htmlFor="reg-bank-account-number" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                                    เลขที่บัญชีธนาคาร <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)" }}>(ตัวเลขล้วน 10-12 หลัก)</span>
                                </label>
                                <input
                                    id="reg-bank-account-number"
                                    type="tel"
                                    maxLength={12}
                                    placeholder="เช่น 1234567890 (ตัวเลขเท่านั้น)"
                                    value={watch("bankAccountNumber") || ""}
                                    onChange={(e) => {
                                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 12);
                                        setValue("bankAccountNumber", digitsOnly);
                                    }}
                                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                                />

                                <label htmlFor="reg-bank-account-name" style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                                    ชื่อบัญชีธนาคาร
                                </label>
                                <input
                                    id="reg-bank-account-name"
                                    placeholder="ชื่อและนามสกุลตรงตามสมุดบัญชี"
                                    {...register("bankAccountName")}
                                    style={{ display: "block", width: "100%", marginBottom: 4 }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: รายการสินค้า */}
                {step === 2 && (
                    <div>
                        <DynamicProductFieldList
                            control={control}
                            register={register}
                            watch={watch}
                            setValue={setValue}
                        />
                        {watch("products")?.length === 0 && (
                            <p style={{ color: "var(--color-warning)", fontSize: 13, marginTop: 8 }}>
                                ต้องเพิ่มสินค้าอย่างน้อย 1 ชิ้นก่อนกดยืนยันสมัครร้าน
                            </p>
                        )}
                    </div>
                )}

                {/* Submit Error Alert */}
                {submitError && (
                    <div
                        role="alert"
                        style={{
                            color: "var(--color-danger)",
                            background: "var(--color-status-rejected-bg)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                            marginTop: 16,
                            whiteSpace: "pre-line",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                        }}
                    >
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                            <Icon name="alert" size={16} color="var(--color-danger)" />
                        </div>
                        <div style={{ flex: 1 }}>{submitError}</div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
                    {step > 0 ? (
                        <button
                            type="button"
                            onClick={goBack}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "10px 18px",
                            }}
                        >
                            <Icon name="arrow-left" size={16} />
                            ย้อนกลับ
                        </button>
                    ) : (
                        <span />
                    )}

                    {step < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={goNext}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "10px 20px",
                                background: "var(--color-primary)",
                                color: "#fff",
                            }}
                        >
                            ถัดไป
                            <Icon name="arrow-right" size={16} color="#fff" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting || watch("products")?.length === 0}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 24px",
                                background: "var(--color-primary)",
                                color: "#fff",
                                opacity: submitting || watch("products")?.length === 0 ? 0.6 : 1,
                            }}
                        >
                            {submitting ? (
                                <>
                                    <Icon name="sparkle" size={16} color="#fff" />
                                    กำลังตรวจสอบและเปิดร้าน...
                                </>
                            ) : (
                                <>
                                    <Icon name="check" size={16} color="#fff" />
                                    ยืนยันเปิดร้านทันที
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
