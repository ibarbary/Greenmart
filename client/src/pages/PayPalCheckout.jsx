import { useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { context } from "../context/AppContext";
import axios from "../Utils/axiosInstance.js";
import toast from "react-hot-toast";
import paypal from "../assets/paypal.png";

const PayPalCheckout = () => {
  const location = useLocation();
  const { orderData } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { setCart, navigate, selectedAddress } = useContext(context);

  if (!orderData) {
    navigate("/cart");
    return null;
  }

  const handlePayPalPayment = async () => {
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      await axios.post(
        "/api/orders",
        {
          ...orderData,
          paypal_transaction_id: `PYPL_${Date.now()}`,
        },
       
      );

      setCart({});
      toast.success("Payment successful! Order placed");
      navigate("/my-orders");
    } catch (error) {
      console.error(error);
      toast.error("Order creation failed");
      navigate("/cart");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setShowLoginForm(false);
    setShowPaymentForm(true);
  };

  const handleCancel = () => {
    navigate("/cart");
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Processing Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we process your PayPal payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src={paypal} alt="paypal logo" className="w-6 h-6" />
            <span className="text-2xl font-bold text-blue-800">PayPal</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {showLoginForm && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Log in to your PayPal account
                </h2>

                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email or mobile number
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors mb-4 cursor-pointer"
                  >
                    Log In
                  </button>
                </form>

                <div className="text-center">
                  <a href="#" className="text-blue-600 hover:underline text-sm">
                    Forgot password?
                  </a>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-center text-gray-600 text-sm mb-4">
                    Don't have a PayPal account?
                  </p>
                  <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-900 transition-colors cursor-pointer">
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {showPaymentForm && (
              <div>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => {
                      setShowLoginForm(true);
                      setShowPaymentForm(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 mr-4 cursor-pointer"
                  >
                    ← Back
                  </button>
                </div>

                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Review your payment
                </h2>

                <div className="mb-6">
                  <div className="border rounded-lg p-4 mb-3 bg-blue-50 border-blue-300">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="paypal-balance"
                        name="payment-method"
                        defaultChecked
                        className="mr-3"
                      />
                      <label htmlFor="paypal-balance" className="flex-1">
                        <div className="font-medium">PayPal Balance</div>
                        <div className="text-sm text-gray-600">
                          $2000 available
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayPalPayment}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Complete Payment
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Order Summary
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span>
                  ${(orderData.amount - orderData.delivery_fee).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span>
                  {orderData.delivery_fee === 0
                    ? "Free"
                    : `$${orderData.delivery_fee.toFixed(2)}`}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${orderData.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <h4 className="font-medium text-gray-800 mb-2">
                Delivery Address
              </h4>
              <p className="text-sm text-gray-600">
                {selectedAddress
                  ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}`
                  : "Order will be delivered to your selected address"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalCheckout;
