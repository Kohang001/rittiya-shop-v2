// src/hooks/useOrders.js
import { useEffect, useState } from "react";
import { getOrdersByShop, getAllOrdersForAdmin } from "../firebase/firestore";

/** ใช้ในหน้า Seller — ออเดอร์ของร้านตัวเอง */
export function useShopOrders(shopId) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!shopId) return;
        setLoading(true);
        getOrdersByShop(shopId)
            .then(setOrders)
            .catch((err) => {
                console.error("useShopOrders error:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [shopId]);

    return { orders, loading, error };
}

/** ใช้ในหน้า Admin — ออเดอร์ทั้งหมดทุกร้าน */
export function useAllOrdersForAdmin() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAllOrdersForAdmin()
            .then(setOrders)
            .catch((err) => {
                console.error("useAllOrdersForAdmin error:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, []);

    return { orders, loading, error };
}