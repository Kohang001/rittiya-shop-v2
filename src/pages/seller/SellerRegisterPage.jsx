// src/pages/seller/SellerRegisterPage.jsx
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../firebase/auth";
import { createShopDraft, addProduct } from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";
import DynamicProductFieldList from "../../components/form/DynamicProductFieldList";

const STEPS = ["บัญชีผู้ใช้", "ข้อมูลร้านค้า", "สินค้า"];

export default function SellerRegisterPage() {
    const [step, setStep] = useState(0);
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const hasSubmittedRef = useRef(false); // กัน submit ซ้ำแม้มีคลิกซ้อนกันจริง (double-click)
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
        // กันการ submit ซ้ำ (เช่นจากคลิกซ้อนกัน) — ถ้าเคย submit ไปแล้วให้หยุดทันที
        if (hasSubmittedRef.current) return;

        // บังคับต้องมีสินค้าอย่างน้อย 1 ชิ้นก่อน ถึงจะสมัครร้านได้
        if (!data.products || data.products.length === 0) {
            setSubmitError("กรุณาเพิ่มสินค้าอย่างน้อย 1 ชิ้นก่อนสมัครร้าน");
            setStep(2); // เด้งกลับไปหน้าสินค้าให้แน่ใจว่าเห็น error
            return;
        }

        hasSubmittedRef.current = true;
        setSubmitError("");
        setSubmitting(true);

        try {
            // 1. สมัครบัญชี Auth
            const { user, error: authError } = await registerUser(data.email, data.password);
            if (authError) {
                setSubmitError(authError);
                setSubmitting(false);
                hasSubmittedRef.current = false; // อนุญาตให้ลอง submit ใหม่ได้ถ้าสมัคร Auth ไม่ผ่าน
                setStep(0);
                return;
            }

            // 2. สร้างร้าน (status: pending)
            const { id: shopId, lineLinkCode } = await createShopDraft({
                ownerUid: user.uid,
                name: data.name,
                slogan: data.slogan,
                logoUrl: data.logoUrl,
                phone: data.phone,
                ig: data.ig,
                category: data.category,
            });

            // 3. เพิ่มสินค้าทุกชิ้นที่กรอกไว้ (status: pending ทุกชิ้น)
            for (const product of data.products) {
                await addProduct(shopId, {
                    name: product.name,
                    desc: product.desc,
                    price: parseFloat(product.price) || 0,
                    imageUrl: product.imageUrl,
                });
            }

            // 4. ไปหน้ารอการอนุมัติ พร้อมโชว์รหัสผูก LINE
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
                            borderRadius: 6,
                            fontSize: 12,
                            background: i === step ? "#333" : "#eee",
                            color: i === step ? "#fff" : "#555",
                        }}
                    >
                        {i + 1}. {label}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {step === 0 && (
                    <div>
                        <label>อีเมล</label>
                        <input
                            type="email"
                            {...register("email", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {errors.email && <p style={{ color: "red" }}>กรุณากรอกอีเมล</p>}

                        <label>รหัสผ่าน</label>
                        <input
                            type="password"
                            {...register("password", { required: true, minLength: 6 })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {errors.password && (
                            <p style={{ color: "red" }}>รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
                        )}

                        <label>ยืนยันรหัสผ่าน</label>
                        <input
                            type="password"
                            {...register("confirmPassword", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <label>ชื่อร้าน</label>
                        <input
                            {...register("name", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {errors.name && <p style={{ color: "red" }}>กรุณากรอกชื่อร้าน</p>}

                        <label>สโลแกน</label>
                        <input
                            {...register("slogan")}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />

                        <ImageUploadField
                            label="โลโก้ร้าน"
                            value={watch("logoUrl")}
                            onChange={(url) => setValue("logoUrl", url)}
                        />

                        <label>เบอร์โทร</label>
                        <input
                            {...register("phone", { required: true })}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />
                        {errors.phone && <p style={{ color: "red" }}>กรุณากรอกเบอร์โทร</p>}

                        <label>ไอจี (ไม่บังคับ)</label>
                        <input
                            {...register("ig")}
                            style={{ display: "block", width: "100%", marginBottom: 8 }}
                        />

                        <label>หมวดหมู่</label>
                        <input
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
                            <p style={{ color: "#b45", fontSize: 13 }}>
                                ⚠️ ต้องเพิ่มสินค้าอย่างน้อย 1 ชิ้นก่อนกด "ยืนยันสมัครร้าน"
                            </p>
                        )}
                    </div>
                )}

                {submitError && <p style={{ color: "red" }}>{submitError}</p>}

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
                        <button
                            type="submit"
                            disabled={submitting || watch("products")?.length === 0}
                        >
                            {submitting ? "กำลังสมัคร..." : "ยืนยันสมัครร้าน"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}