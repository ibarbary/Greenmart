import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../Utils/axiosInstance.js";
import { context } from "../context/AppContext";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState(""); // verifying | success | error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendStatus, setResendStatus] = useState(null); // loading | success | error
  const [resendMsg, setResendMsg] = useState("");
  const { setUser, navigate, user } = useContext(context);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) return;

      try {
        setStatus("verifying");
        const { data } = await axios.get(
          `/api/auth/verify-email?token=${token}`
        );

        setStatus("success");
        setMessage(message || "Email verified successfully!");
        setTimeout(() => {
          setUser(data.user);
          navigate("/");
        }, 2000);
      } catch (error) {
        const msg = error.response?.data?.error || "Verification failed.";
        setStatus("error");
        setMessage(msg);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;

    setResendStatus("loading");
    setResendMsg("");

    try {
      const res = await axios.post("/api/auth/resend-verification", { email });
      setResendStatus("success");
      setResendMsg(res.data.message);
    } catch (err) {
      const error = err.response?.data?.error || "Failed to resend email.";
      setResendStatus("error");
      setResendMsg(error);
    }
  };

  return (
    <div className="flex items-center justify-center mt-24">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
        {!token && (
          <>
            <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
            <p className="text-gray-600 mb-6">
              Please check your inbox for a verification link.
            </p>

            <form onSubmit={handleResend} className="space-y-8">
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
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-darker disabled:bg-gray-400 disabled:cursor-not-allowed  transition cursor-pointer"
                disabled={resendStatus === "loading"}
              >
                {resendStatus === "loading"
                  ? "Resending..."
                  : "Resend Verification Email"}
              </button>
              {resendStatus && (
                <p
                  className={`text-sm ${
                    resendStatus === "success"
                      ? "text-green-600"
                      : resendStatus === "error"
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {resendMsg}
                </p>
              )}
            </form>
          </>
        )}

        {token && status === "verifying" && (
          <>
            <h1 className="text-2xl font-bold mb-4">Verifying...</h1>
            <p className="text-gray-600">
              Please wait while we verify your email.
            </p>
          </>
        )}

        {token && status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Success!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {token && status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Verification Failed
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
