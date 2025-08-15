import { useContext, useState } from "react";
import Broccoli from "../assets/broccoli.png";
import searchIcon from "../assets/search-icon.png";
import shoppingCart from "../assets/shopping-cart.png";
import menuIcon from "../assets/menu.png";
import profileIcon from "../assets/user.png";
import { Link } from "react-router-dom";
import { context } from "../context/AppContext";
import toast from "react-hot-toast";
import axios from "../Utils/axiosInstance.js";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    navigate,
    user,
    setShowUserLogin,
    setShowUserSignup,
    totalItems,
    handleLogout,
  } = useContext(context);

  async function logout() {
    setIsLoggingOut(true);
    try {
      await axios.get("/api/auth/logout");

      setOpen(false);
      handleLogout();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.error || "Something went wrong, try again later.";
      toast.error(message);
    } finally {
      setIsLoggingOut(false);
    }
  }

  const handleSearch = async () => {
    if (searchInput.trim()) {
      navigate(`/products?query=${searchInput.trim()}`);
    } else {
      navigate("/products");
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 lg:px-14 xl:px-20 py-4 border-b border-gray-300 bg-white relative transition-all">
      <Link to={"/"} className="flex items-center gap-1">
        <img className="h-9" src={Broccoli} alt="logo" />
        <h1 className="text-3xl font-bold">Greenmart</h1>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-8">
        <Link to={"/"}>Home</Link>
        <Link to={"/products"}>Products</Link>

        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
          {" "}
          <input
            className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
            type="text"
            placeholder="Search products"
            onChange={(e) => {
              setSearchInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />{" "}
          <button
            type="button"
            onClick={handleSearch}
            className="cursor-pointer"
          >
            {" "}
            <img src={searchIcon} alt="search" />{" "}
          </button>{" "}
        </div>

        <div
          className="relative cursor-pointer"
          onClick={() => {
            navigate("/cart");
          }}
        >
          <img src={shoppingCart} alt="cart" />
          <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">
            {totalItems}
          </button>
        </div>

        {!user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowUserLogin(true);
              }}
              className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-darker transition text-white rounded-full"
            >
              Login
            </button>

            <button
              className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-darker transition text-white rounded-full"
              onClick={() => setShowUserSignup(true)}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="relative group">
            <img src={profileIcon} alt="profileIcon" className="w-9" />
            <div className="absolute top-0 right-0 w-full h-10 group-hover:block hidden"></div>
            <ul className="hidden group-hover:block absolute top-9 right-0 bg-white shadow-lg border border-gray-200 py-3 w-40 rounded-md text-sm z-40">
              <li
                onClick={() => {
                  navigate("/my-orders");
                }}
                className="p-2 pl-3 hover:bg-primary/10 cursor-pointer transition-colors"
              >
                My Orders
              </li>
              <li
                onClick={!isLoggingOut ? logout : null}
                className="p-2 pl-3 hover:bg-primary/10 cursor-pointer transition-colors"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 sm:hidden">
        <div
          className="relative cursor-pointer"
          onClick={() => {
            navigate("/cart");
          }}
        >
          <img src={shoppingCart} alt="cart" />
          <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">
            {totalItems}
          </button>
        </div>

        <button
          onClick={() => (open ? setOpen(false) : setOpen(true))}
          aria-label="Menu"
          className="cursor-pointer"
        >
          <img src={menuIcon} alt="menu" className="w-8" />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${
          open ? "flex" : "hidden"
        } absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden z-1`}
      >
        <Link to={"/"} className="block">
          Home
        </Link>
        <Link to={"/products"} className="block">
          Products
        </Link>

        {user && (
          <Link to={"/my-orders"} className="block">
            My Orders
          </Link>
        )}

        {!user ? (
          <div className="flex items-center gap-2">
            <button
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-darker transition text-white rounded-full text-sm"
              onClick={() => setShowUserLogin(true)}
            >
              Login
            </button>

            <button
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-darker transition text-white rounded-full text-sm"
              onClick={() => setShowUserSignup(true)}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-darker transition text-white rounded-full text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
