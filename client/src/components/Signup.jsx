import { useContext, useState } from "react";
import { context } from "../context/AppContext";
import { isStrongPassword, validateEmail } from "../Utils/validator";
import hide from "../assets/hide.png";
import see from "../assets/see.png";
import axios from "../Utils/axiosInstance.js";
import toast from "react-hot-toast";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isValidPassword, setIsValidPassword] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setShowUserSignup, setShowUserLogin, navigate } = useContext(context);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data } = await axios.post("/api/auth/signup", {
        name,
        email,
        password,
      });

      toast.dismiss();
      toast.success(data.message);
      setShowUserSignup(false);
      navigate("/verify-email");
    } catch (error) {
      console.log(error);
      const message =
        error.response?.data?.error || "Something went wrong, try again later.";
      toast.dismiss();
      toast.error(message);
    }
  }

  return (
    <div
      className="fixed top-0 bottom-0 left-0 right-0 z-30 flex items-center text-sm text-gray-600 bg-black/50"
      onClick={() => setShowUserSignup(false)}
    >
      <form
        className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[400px] rounded-lg shadow-xl border border-gray-200 bg-white"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => handleSubmit(e)}
      >
        <p className="text-2xl font-medium m-auto">Sign Up</p>

        <div className="w-full">
          <p>Name</p>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            className="border border-gray-200 rounded w-full p-2 mt-1 outline-none"
            type="text"
            required
          />
        </div>

        <div className="w-full ">
          <p>Email</p>
          <input
            onChange={(e) => {
              setIsValidEmail(validateEmail(e.target.value.trim()));
              setEmail(e.target.value.trim());
            }}
            value={email}
            className={`border border-gray-200 rounded w-full p-2 mt-1 outline-none ${
              email.length > 0
                ? isValidEmail
                  ? "border-green-400"
                  : "border-red-400"
                : "border-gray-200"
            }`}
            type="email"
            required
          />

          {email.length > 0 && !isValidEmail && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid email address
            </p>
          )}
        </div>
        <div className="w-full ">
          <p>Password</p>
          <div className="relative">
            <input
              onChange={(e) => {
                setIsValidPassword(isStrongPassword(e.target.value));
                setPassword(e.target.value);
              }}
              value={password}
              className={`border border-gray-200 rounded w-full p-2 mt-1 outline-none ${
                password.length > 0
                  ? isValidPassword
                    ? "border-green-400"
                    : "border-red-400"
                  : "border-gray-200"
              }`}
              type={showPassword ? "text" : "password"}
              required
            />

            <img
              src={showPassword ? hide : see}
              alt="eye"
              className="w-5 h-5 absolute right-3 top-3.5 cursor-pointer"
              onClick={() => {
                setShowPassword(!showPassword);
              }}
            />
          </div>

          {password.length > 0 && !isValidPassword && (
            <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-3">
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
        </div>

        <p>
          Already have account?{" "}
          <span
            onClick={() => {
              setShowUserSignup(false);
              setShowUserLogin(true);
            }}
            className="text-primary cursor-pointer"
          >
            click here
          </span>
        </p>

        <button
          disabled={!isValidPassword || isSubmitting}
          className="w-full py-2 rounded-md transition-all bg-primary hover:bg-primary-darker text-white disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? "Submitting..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
