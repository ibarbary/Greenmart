import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import Login from "./components/Login";
import { useContext } from "react";
import { context } from "./context/AppContext";
import Products from "./pages/Products";
import ProductCategory from "./pages/ProductCategory";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import AddAddress from "./pages/AddAddress";
import EditAddress from "./pages/EditAddress";
import MyOrders from "./pages/MyOrders";
import SellerLayout from "./pages/seller/SellerLayout";
import AddProduct from "./pages/seller/AddProduct";
import ProductsList from "./pages/seller/ProductsList";
import Orders from "./pages/seller/Orders";
import Signup from "./components/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EditProduct from "./pages/seller/EditProduct";
import SellerProductDetails from "./pages/seller/SellerProductDetails";
import PayPalCheckout from "./pages/PayPalCheckout";
import ComplaintForm from "./pages/ComplaintForm";
import Complaints from "./pages/seller/Complaints";
import AddCategory from "./pages/seller/AddCategory";
import CategoriesList from "./pages/seller/CategoriesList";
import EditCategory from "./pages/seller/EditCategory";

function App() {
  const { showUserLogin, showUserSignup, isSeller } = useContext(context);

  return (
    <>
      <Toaster />
      {isSeller ? (
        <>
          <Routes>
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<AddProduct />} />

              <Route path="products" element={<ProductsList />} />
              <Route path="products/:id" element={<SellerProductDetails />} />
              <Route path="add_category" element={<AddCategory />} />
              <Route path="categories" element={<CategoriesList />} />
              <Route path="edit-product/:id" element={<EditProduct />} />
              <Route path="edit-category/:id" element={<EditCategory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="complaints" element={<Complaints />} />
            </Route>
            <Route path="*" element={<Navigate to="/seller" />} />
          </Routes>
        </>
      ) : (
        <>
          <Navbar />
          {showUserLogin ? <Login /> : null}
          {showUserSignup ? <Signup /> : null}
          <div className="px-6 md:px-16 lg:px-24 xl:px-32">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/paypal-checkout" element={<PayPalCheckout />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:category" element={<ProductCategory />} />
              <Route
                path="/products/:category/:id"
                element={<ProductDetails />}
              />
              <Route path="/add-address" element={<AddAddress />} />
              <Route path="/edit-address/:id" element={<EditAddress />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/complaint/:id" element={<ComplaintForm />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <Footer />
        </>
      )}
    </>
  );
}
export default App;
