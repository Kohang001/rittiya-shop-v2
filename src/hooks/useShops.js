// src/hooks/useShops.js
import { useEffect, useState } from "react";
import { getApprovedShops, getShopById, getShopsByOwner, getAllShopsForAdmin } from "../firebase/firestore";

/** ใช้ในหน้า Home — ร้านที่ approved แล้วทั้งหมด */
export function useApprovedShops() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getApprovedShops()
            .then(setShops)
            .catch((err) => {
                console.error("useApprovedShops error:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, []);

    return { shops, loading, error };
}

/** ใช้ในหน้า ShopDetailPage — ร้านเดียวตาม id */
export function useShop(shopId) {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!shopId) return;
        setLoading(true);
        getShopById(shopId)
            .then(setShop)
            .catch((err) => {
                console.error("useShop error:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [shopId]);

    return { shop, loading, error };
}

/** ใช้ใน Seller Dashboard ทุกหน้าย่อย — ร้านของ user ที่ login อยู่ */
export function useMyShop(ownerUid) {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!ownerUid) return;
        setLoading(true);
        getShopsByOwner(ownerUid)
            .then((shops) => setShop(shops[0] || null))
            .catch((err) => {
                console.error("useMyShop error:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [ownerUid]);

    return { shop, loading, error };
}

/** ใช้ในหน้า Admin — ร้านทั้งหมดทุกสถานะ */
export function useAllShopsForAdmin() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function reload() {
        setLoading(true);
        try {
            const data = await getAllShopsForAdmin();
            setShops(data);
        } catch (err) {
            console.error("useAllShopsForAdmin error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();
    }, []);

    return { shops, loading, error, reload };
}