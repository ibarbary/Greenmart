import axios from "../Utils/axiosInstance.js";
import { useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // submitting | success | error
  const [message, setMessage] = useState("");

  async function handleResetLink(e) {
    e.preventDefault();
    if (!email) return;

    setMessage("");
    setStatus("submitting");

    try {
      const { data } = await axios.post(
        `/api/auth/forgot-password`,
        { email },
        
      );

      setStatus("success");
      setMessage(data.message || "Password reset email sent successfully");
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to send reset email";
      setStatus("error");
      setMessage(msg);
    }
  }
  return (
    <div className="flex items-center justify-center mt-24">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
        <>
          <h1 className="text-2xl font-bold mb-4">Forgot Your Password?</h1>
          <p className="text-gray-600 mb-6">
            No problem. Just let us know your email address and we will email
            you a password reset link
          </p>

          <form onSubmit={handleResetLink} className="space-y-8">
            <input
              type="email"
              className="border border-gray-400 rounded w-full p-2 mt-1 outline-none"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={status == "submitting"}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-darker transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {status === "submitting"
                ? "Sending Link..."
                : "Give me Reset Link"}
            </button>
            <p
              className={`text-sm ${
                status === "success"
                  ? "text-green-600"
                  : status === "error"
                  ? "text-red-600"
                  : ""
              }`}
            >
              {message}
            </p>
          </form>
        </>
      </div>
    </div>
  );
}
export default ForgotPassword;
