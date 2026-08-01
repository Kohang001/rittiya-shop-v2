// src/hooks/useProducts.js
import { useEffect, useState } from "react";
import { getApprovedProducts, getAllProducts } from "../firebase/firestore";

/** ใช้ในหน้า ShopDetailPage — สินค้าที่ approved แล้วของร้านนี้ */
export function useApprovedProducts(shopId) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!shopId) return;
        setLoading(true);
        getApprovedProducts(shopId)
            .then(setProducts)
            .catch((err) => {
                console.error("useApprovedProducts error:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [shopId]);

    return { products, loading, error };
}

/** ใช้ใน Seller/Admin — สินค้าทุกสถานะของร้านนี้ พร้อมฟังก์ชัน reload หลังแก้ไข/อนุมัติ */
export function useAllProducts(shopId) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function reload() {
        if (!shopId) return;
        setLoading(true);
        try {
            const data = await getAllProducts(shopId);
            setProducts(data);
        } catch (err) {
            console.error("useAllProducts error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();
    }, [shopId]);

    return { products, loading, error, reload };
}