// src/context/CartContext.jsx
import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    // เก็บตะกร้าแยกตามร้าน: { [shopId]: { [productId]: { product, qty } } }
    const [cartByShop, setCartByShop] = useState({});

    function addItem(shopId, product) {
        setCartByShop((prev) => {
            const shopCart = prev[shopId] || {};
            const existing = shopCart[product.id];
            return {
                ...prev,
                [shopId]: {
                    ...shopCart,
                    [product.id]: {
                        product,
                        qty: existing ? existing.qty + 1 : 1,
                    },
                },
            };
        });
    }

    function setQty(shopId, productId, qty) {
        setCartByShop((prev) => {
            const shopCart = { ...(prev[shopId] || {}) };
            if (qty <= 0) {
                delete shopCart[productId];
            } else {
                shopCart[productId] = { ...shopCart[productId], qty };
            }
            return { ...prev, [shopId]: shopCart };
        });
    }

    function clearCart(shopId) {
        setCartByShop((prev) => ({ ...prev, [shopId]: {} }));
    }

    function getCartItems(shopId) {
        const shopCart = cartByShop[shopId] || {};
        return Object.values(shopCart);
    }

    function getTotal(shopId) {
        return getCartItems(shopId).reduce(
            (sum, item) => sum + item.product.price * item.qty,
            0
        );
    }

    const value = { addItem, setQty, clearCart, getCartItems, getTotal };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart ต้องถูกเรียกใช้ภายใน <CartProvider> เท่านั้น");
    }
    return context;
}