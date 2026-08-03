// src/App.jsx — เพิ่ม Footer, ContactPage, AdminOrdersPage, AdminProductsPage
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import HomePage from "./pages/public/HomePage";
import FeedPage from "./pages/public/FeedPage";
import ShopDetailPage from "./pages/public/ShopDetailPage";
import ContactPage from "./pages/public/ContactPage";
import SearchPage from "./pages/public/SearchPage";
import SellerLoginPage from "./pages/seller/SellerLoginPage";
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import PendingApprovalPage from "./pages/seller/PendingApprovalPage";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerLineLinkPage from "./pages/seller/SellerLineLinkPage";
import SellerFeedPostPage from "./pages/seller/SellerFeedPostPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminShopsPage from "./pages/admin/AdminShopsPage";
import AdminShopDetailPage from "./pages/admin/AdminShopDetailPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminFeedPage from "./pages/admin/AdminFeedPage";

function App() {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />

            <div style={{ flex: 1 }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/shop/:shopId" element={<ShopDetailPage />} />

                    <Route path="/seller/login" element={<SellerLoginPage />} />
                    <Route path="/seller/register" element={<SellerRegisterPage />} />
                    <Route path="/seller/pending-approval" element={<PendingApprovalPage />} />
                    <Route
                        path="/seller/dashboard"
                        element={
                            <ProtectedRoute>
                                <SellerDashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/seller/products"
                        element={
                            <ProtectedRoute>
                                <SellerProductsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/seller/orders"
                        element={
                            <ProtectedRoute>
                                <SellerOrdersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/seller/line-link"
                        element={
                            <ProtectedRoute>
                                <SellerLineLinkPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/seller/feed/new"
                        element={
                            <ProtectedRoute>
                                <SellerFeedPostPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ---------- Admin — ไม่มีลิงก์จาก Navbar ต้องพิมพ์ URL ตรงเท่านั้น ---------- */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route
                        path="/admin/shops"
                        element={
                            <AdminRoute>
                                <AdminShopsPage />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/shops/:shopId"
                        element={
                            <AdminRoute>
                                <AdminShopDetailPage />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/orders"
                        element={
                            <AdminRoute>
                                <AdminOrdersPage />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/products"
                        element={
                            <AdminRoute>
                                <AdminProductsPage />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/feed"
                        element={
                            <AdminRoute>
                                <AdminFeedPage />
                            </AdminRoute>
                        }
                    />
                </Routes>
            </div>

            <Footer />
        </div>
    );
}

export default App;