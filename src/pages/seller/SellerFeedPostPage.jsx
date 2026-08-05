// src/pages/seller/SellerFeedPostPage.jsx — อัปเดต: Toast แทน alert()
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getShopsByOwner, createFeedPost } from "../../firebase/firestore";
import ImageUploadField from "../../components/form/ImageUploadField";
import PageSkeleton from "../../components/ui/PageSkeleton";

export default function SellerFeedPostPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
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
            await createFeedPost({ shopId: shop.id, title, content, imageUrl, shopName: shop.name, shopLogoUrl: shop.logoUrl || "" });
            showToast("เผยแพร่ประกาศสำเร็จ ขึ้นหน้า Feed ทันที", "success");
            navigate("/seller/dashboard");
        } catch (err) {
            console.error(err);
            showToast("เพิ่มประกาศไม่สำเร็จ ลองใหม่อีกครั้ง", "error");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <PageSkeleton lines={4} />;
    if (!shop) return <p style={{ textAlign: "center", marginTop: 40 }}>ไม่พบร้านค้า</p>;

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px" }}>
            <h2>เพิ่มประกาศใหม่</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="feed-title">หัวข้อประกาศ</label>
                <input
                    id="feed-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <label htmlFor="feed-content">ข้อความ</label>
                <textarea
                    id="feed-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                    required
                />

                <ImageUploadField label="รูปประกอบ (ไม่บังคับ)" value={imageUrl} onChange={setImageUrl} />

                <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    ประกาศนี้จะขึ้นหน้า Feed สาธารณะทันที (Admin สามารถซ่อนได้ทีหลังถ้ามีเนื้อหาไม่เหมาะสม)
                </p>

                <button type="submit" disabled={submitting}>
                    {submitting ? "กำลังบันทึก..." : "เผยแพร่ประกาศ"}
                </button>
            </form>
        </div>
    );
}