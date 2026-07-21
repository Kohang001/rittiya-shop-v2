// src/App.jsx — เพิ่ม routes ของ Phase 5 (Seller Dashboard ทุกหน้าย่อย)
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import HomePage from "./pages/public/HomePage";
import FeedPage from "./pages/public/FeedPage";
import ShopDetailPage from "./pages/public/ShopDetailPage";
import SellerLoginPage from "./pages/seller/SellerLoginPage";
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import PendingApprovalPage from "./pages/seller/PendingApprovalPage";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerLineLinkPage from "./pages/seller/SellerLineLinkPage";
import SellerFeedPostPage from "./pages/seller/SellerFeedPostPage";

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/feed" element={<FeedPage />} />
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
            </Routes>
        </>
    );
}

export default App;