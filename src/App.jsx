// src/App.jsx — Code-Splitting with React.lazy + Suspense for Ultra-Fast Mobile First Paint
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import PageSkeleton from "./components/ui/PageSkeleton";

// โหลดหน้าแรกแบบทันที เพื่อความเร็วระดับมิลลิวินาทีสำหรับผู้ซื้อ
import HomePage from "./pages/public/HomePage";

// โหลดหน้าอื่นๆ แบบไดนามิก (Route-Level Code Splitting)
const FeedPage = lazy(() => import("./pages/public/FeedPage"));
const ShopDetailPage = lazy(() => import("./pages/public/ShopDetailPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));
const SearchPage = lazy(() => import("./pages/public/SearchPage"));
const LoginPage = lazy(() => import("./pages/public/LoginPage"));
const RegisterPage = lazy(() => import("./pages/public/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/public/ProfilePage"));

// Seller Portal (แยก Chunk เฉพาะแม่ค้า)
const SellerLoginPage = lazy(() => import("./pages/seller/SellerLoginPage"));
const SellerRegisterPage = lazy(() => import("./pages/seller/SellerRegisterPage"));
const SellerDashboardPage = lazy(() => import("./pages/seller/SellerDashboardPage"));
const PendingApprovalPage = lazy(() => import("./pages/seller/PendingApprovalPage"));
const SellerProductsPage = lazy(() => import("./pages/seller/SellerProductsPage"));
const SellerOrdersPage = lazy(() => import("./pages/seller/SellerOrdersPage"));
const SellerLineLinkPage = lazy(() => import("./pages/seller/SellerLineLinkPage"));
const SellerFeedPostPage = lazy(() => import("./pages/seller/SellerFeedPostPage"));
const SellerShopEditPage = lazy(() => import("./pages/seller/SellerShopEditPage"));

// Admin Console (แยก Chunk เฉพาะผู้ดูแลระบบ — ป้องกันผู้ใช้ทั่วไปโหลดโค้ดหลังบ้าน)
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminShopsPage = lazy(() => import("./pages/admin/AdminShopsPage"));
const AdminShopDetailPage = lazy(() => import("./pages/admin/AdminShopDetailPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminFeedPage = lazy(() => import("./pages/admin/AdminFeedPage"));
const AdminRolesPage = lazy(() => import("./pages/admin/AdminRolesPage"));

function App() {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />

            <div style={{ flex: 1 }}>
                <Suspense
                    fallback={
                        <div style={{ maxWidth: 1000, margin: "32px auto", padding: "0 16px" }}>
                            <PageSkeleton lines={6} />
                        </div>
                    }
                >
                    <Routes>
                        {/* ---------- Public Routes ---------- */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/feed" element={<FeedPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/shop/:shopId" element={<ShopDetailPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* ---------- Seller Routes ---------- */}
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
                        <Route
                            path="/seller/shop/edit"
                            element={
                                <ProtectedRoute>
                                    <SellerShopEditPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* ---------- Admin Routes — ไม่มีลิงก์จาก Navbar เข้าด้วย URL ตรงเท่านั้น ---------- */}
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <AdminDashboardPage />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/admin/dashboard"
                            element={
                                <AdminRoute>
                                    <AdminDashboardPage />
                                </AdminRoute>
                            }
                        />
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
                        <Route
                            path="/admin/roles"
                            element={
                                <AdminRoute>
                                    <AdminRolesPage />
                                </AdminRoute>
                            }
                        />
                    </Routes>
                </Suspense>
            </div>

            <Footer />
        </div>
    );
}

export default App;
