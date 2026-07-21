// src/pages/seller/SellerFeedPostPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getShopsByOwner, createFeedPost } from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";

export default function SellerFeedPostPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function load() {
            const shops = await getShopsByOwner(user.uid);
            setShop(shops[0] || null);
            setLoading(false);
        }
        load();
    }, [user]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title || !content) return;

        setSubmitting(true);
        try {
            await createFeedPost({
                shopId: shop.id,
                title,
                content,
                imageUrl,
            });
            alert("เพิ่มประกาศสำเร็จ! รอ Admin ตรวจสอบก่อนขึ้นหน้า Feed");
            navigate("/seller/dashboard");
        } catch (err) {
            console.error(err);
            alert("เพิ่มประกาศไม่สำเร็จ ลองใหม่อีกครั้ง");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px" }}>
            <h2>เพิ่มประกาศใหม่</h2>
            <form onSubmit={handleSubmit}>
                <label>หัวข้อประกาศ</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <label>ข้อความ</label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <ImageUploadField label="รูปประกอบ (ไม่บังคับ)" value={imageUrl} onChange={setImageUrl} />

                <p style={{ fontSize: 12, color: "#888" }}>
                    ประกาศนี้จะรอ Admin ตรวจสอบก่อนขึ้นแสดงในหน้า Feed สาธารณะ
                </p>

                <button type="submit" disabled={submitting}>
                    {submitting ? "กำลังบันทึก..." : "เผยแพร่ประกาศ"}
                </button>
            </form>
        </div>
    );
}