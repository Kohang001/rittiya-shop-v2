// ตัวอย่าง src/main.jsx อัปเดต — เพิ่ม CartProvider เข้ามาอีกชั้น
// แก้เฉพาะส่วน import และ JSX ที่ครอบ <App /> จากไฟล์เดิมของคุณ

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
