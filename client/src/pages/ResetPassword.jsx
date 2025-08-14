import axios from "../Utils/axiosInstance.js";
import hide from "../assets/hide.png";
import see from "../assets/see.png";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isStrongPassword } from "../Utils/validator";
import { useContext } from "react";
import { context } from "../context/AppContext";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState(searchParams.get("email"));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidPassword, setIsValidPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState(""); // submitting | success | error
  const [message, setMessage] = useState("");

  const { navigate, setShowUserLogin } = useContext(context);

  async function handleResetPassword(e) {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setStatus("error");
      setMessage("All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match");
      return;
    }

    if (!isStrongPassword(password)) {
      setStatus("error");
      setMessage("Password does not meet the strength requirements.");
      return;
    }

    setMessage("");
    setStatus("submitting");

    try {
      const { data } = await axios.post(
        `/api/auth/reset-password`,
        { email, password, confirmPassword, token }
      );

      setStatus("success");
      setMessage(data.message || "Password reset successfully");
      setTimeout(() => {
        navigate("/");
        setShowUserLogin(true);
      }, 2000);
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to reset password";
      setStatus("error");
      setMessage(msg);
    }
  }

  return (
    <div className="flex items-center justify-center mt-24">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-left">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Enter New Password
        </h1>
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="w-full">
            <label className="block mb-1 font-medium text-gray-700">
              Email
            </label>
            <input
              onChange={(e) => setEmail(e.target.value.trim())}
              value={email}
              className="border border-gray-300 rounded w-full p-2 outline-none"
              type="email"
              required
            />
          </div>

          <div className="w-full">
            <label className="block mb-1 font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                onChange={(e) => {
                  setIsValidPassword(isStrongPassword(e.target.value));
                  setPassword(e.target.value);
                }}
                value={password}
                className={`rounded w-full p-2 outline-none border ${
                  password.length > 0
                    ? isValidPassword
                      ? "border-green-400"
                      : "border-red-400"
                    : "border-gray-300"
                }`}
                type={showPassword ? "text" : "password"}
                required
              />
              <img
                src={showPassword ? hide : see}
                alt=""
                className="w-5 h-5 absolute right-3 top-3.5 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block mb-1 font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                className={`rounded w-full p-2 outline-none border ${
                  confirmPassword.length > 0
                    ? password === confirmPassword
                      ? "border-green-400"
                      : "border-red-400"
                    : "border-gray-300"
                }`}
                type={showConfirmPassword ? "text" : "password"}
                required
              />
              <img
                src={showConfirmPassword ? hide : see}
                alt=""
                className="w-5 h-5 absolute right-3 top-3.5 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
          </div>

          {password.length > 0 && !isValidPassword && (
            <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
              Password must include:
              <ul className="list-disc ml-6 mt-1">
                <li>At least 8 characters</li>
                <li>1 lowercase letter</li>
                <li>1 uppercase letter</li>
                <li>1 number</li>
                <li>1 special character</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-darker transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === "submitting" ? "Submitting..." : "Reset Password"}
          </button>

          {message && (
            <p
              className={`text-center text-sm mt-2 ${
                status === "success"
                  ? "text-green-600"
                  : status === "error"
                  ? "text-red-600"
                  : ""
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
