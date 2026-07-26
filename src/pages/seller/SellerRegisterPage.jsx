// src/pages/seller/SellerRegisterPage.jsx — อัปเดตหลัง UX Audit: label ผูก id/htmlFor + password toggle
// (ยังคงทุก fix เดิม: double-submit guard, บังคับมีสินค้าอย่างน้อย 1 ชิ้น, แจ้งเตือน Admin)
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../firebase/auth";
import { createShopDraft, addProduct } from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";
import DynamicProductFieldList from "../../components/form/DynamicProductFieldList";
import PasswordInput from "../../components/ui/PasswordInput";

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
            ig: "",
            category: "",
            products: [],
        },
    });

    async function goNext() {
        let fieldsToValidate = [];
        if (step === 0) fieldsToValidate = ["email", "password", "confirmPassword"];
        if (step === 1) fieldsToValidate = ["name", "slogan", "phone"];

        const valid = await trigger(fieldsToValidate);
        if (!valid) return;

        if (step === 0) {
            const password = watch("password");
            const confirmPassword = watch("confirmPassword");
            if (password !== confirmPassword) {
                setSubmitError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
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

        if (!data.products || data.products.length === 0) {
            setSubmitError("กรุณาเพิ่มสินค้าอย่างน้อย 1 ชิ้นก่อนสมัครร้าน");
            setStep(2);
            return;
        }

        hasSubmittedRef.current = true;
        setSubmitError("");
        setSubmitting(true);

        try {
            const { user, error: authError } = await registerUser(data.email, data.password);
            if (authError) {
                setSubmitError(authError);
                setSubmitting(false);
                hasSubmittedRef.current = false;
                setStep(0);
                return;
            }

            const { id: shopId, lineLinkCode } = await createShopDraft({
                ownerUid: user.uid,
                name: data.name,
                slogan: data.slogan,
                logoUrl: data.logoUrl,
                phone: data.phone,
                ig: data.ig,
                category: data.category,
            });

            fetch("/api/notifyNewShop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId }),
            }).catch((err) => console.error("แจ้งเตือน Admin ไม่สำเร็จ (ไม่กระทบการสมัคร):", err));

            for (const product of data.products) {
                await addProduct(shopId, {
                    name: product.name,
                    desc: product.desc,
                    price: parseFloat(product.price) || 0,
                    imageUrl: product.imageUrl,
                });
            }

            navigate("/seller/pending-approval", { state: { lineLinkCode } });
        } catch (err) {
            console.error(err);
            setSubmitError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            hasSubmittedRef.current = false;
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px" }}>
            <h2>สมัครเปิดร้าน</h2>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {STEPS.map((label, i) => (
                    <div
                        key={label}
                        style={{
                            flex: 1,
                            textAlign: "center",
                            padding: 6,
                            borderRadius: "var(--radius-sm)",
                            fontSize: 12,
                            background: i === step ? "var(--color-primary)" : "var(--color-bg-subtle)",
                            color: i === step ? "#fff" : "var(--color-text-muted)",
                        }}
                    >
                        {i + 1}. {label}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {step === 0 && (
                    <div>
                        <label htmlFor="reg-email">อีเมล</label>
                        <input
                            id="reg-email"
                            type="email"
                            {...register("email", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {errors.email && <p style={{ color: "var(--color-danger)" }}>กรุณากรอกอีเมล</p>}

                        <label htmlFor="reg-password">รหัสผ่าน</label>
                        <div style={{ marginBottom: 8 }}>
                            <PasswordInput
                                id="reg-password"
                                {...register("password", { required: true, minLength: 6 })}
                            />
                        </div>
                        {errors.password && (
                            <p style={{ color: "var(--color-danger)" }}>รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
                        )}

                        <label htmlFor="reg-confirm-password">ยืนยันรหัสผ่าน</label>
                        <div style={{ marginBottom: 8 }}>
                            <PasswordInput
                                id="reg-confirm-password"
                                {...register("confirmPassword", { required: true })}
                            />
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <label htmlFor="reg-shop-name">ชื่อร้าน</label>
                        <input
                            id="reg-shop-name"
                            {...register("name", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {errors.name && <p style={{ color: "var(--color-danger)" }}>กรุณากรอกชื่อร้าน</p>}

                        <label htmlFor="reg-slogan">สโลแกน</label>
                        <input
                            id="reg-slogan"
                            {...register("slogan")}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />

                        <ImageUploadField
                            label="โลโก้ร้าน"
                            value={watch("logoUrl")}
                            onChange={(url) => setValue("logoUrl", url)}
                        />

                        <label htmlFor="reg-phone">เบอร์โทร</label>
                        <input
                            id="reg-phone"
                            {...register("phone", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {errors.phone && <p style={{ color: "var(--color-danger)" }}>กรุณากรอกเบอร์โทร</p>}

                        <label htmlFor="reg-ig">ไอจี (ไม่บังคับ)</label>
                        <input
                            id="reg-ig"
                            {...register("ig")}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />

                        <label htmlFor="reg-category">หมวดหมู่</label>
                        <input
                            id="reg-category"
                            placeholder="เช่น อาหาร, เครื่องดื่ม, ของใช้"
                            {...register("category")}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <DynamicProductFieldList
                            control={control}
                            register={register}
                            watch={watch}
                            setValue={setValue}
                        />
                        {watch("products")?.length === 0 && (
                            <p style={{ color: "var(--color-warning)", fontSize: 13 }}>
                                ต้องเพิ่มสินค้าอย่างน้อย 1 ชิ้นก่อนกด "ยืนยันสมัครร้าน"
                            </p>
                        )}
                    </div>
                )}

                {submitError && (
                    <p
                        role="alert"
                        style={{
                            color: "var(--color-danger)",
                            background: "var(--color-status-rejected-bg)",
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                        }}
                    >
                        {submitError}
                    </p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                    {step > 0 ? (
                        <button type="button" onClick={goBack}>
                            ย้อนกลับ
                        </button>
                    ) : (
                        <span />
                    )}

                    {step < STEPS.length - 1 ? (
                        <button type="button" onClick={goNext}>
                            ถัดไป
                        </button>
                    ) : (
                        <button type="submit" disabled={submitting || watch("products")?.length === 0}>
                            {submitting ? "กำลังสมัคร..." : "ยืนยันสมัครร้าน"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}