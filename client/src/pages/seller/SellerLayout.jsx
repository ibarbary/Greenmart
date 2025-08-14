import Broccoli from "../../assets/broccoli.png";
import addProduct from "../../assets/add.png";
import addCategory from "../../assets/categorization.png";
import list from "../../assets/list.png";
import categoryList from "../../assets/categoryList.png";
import orders from "../../assets/orders.png";
import report from "../../assets/report.png";
import { useContext } from "react";
import { context } from "../../context/AppContext";
import { Link, NavLink, Outlet } from "react-router-dom";
import axios from "../../Utils/axiosInstance.js";

const SellerLayout = () => {
  const { setIsSeller, navigate, setUser } = useContext(context);

  const sidebarLinks = [
    { name: "Add Product", path: "/seller", icon: addProduct },
    { name: "Products List", path: "/seller/products", icon: list },
    { name: "Add Category", path: "/seller/add_category", icon: addCategory },
    { name: "Categories List", path: "/seller/categories", icon: categoryList },
    { name: "Orders", path: "/seller/orders", icon: orders },
    { name: "Complaints", path: "/seller/complaints", icon: report },
  ];

  async function logout() {
    try {
      await axios.get("/api/auth/logout");

      setIsSeller(false);
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white transition-all duration-300">
        <Link to={"/seller"} className="flex items-center gap-1">
          <img className="h-9" src={Broccoli} alt="logo" />
          <h1 className="text-3xl font-bold">Greenmart</h1>
        </Link>
        <div className="flex items-center gap-5 text-gray-500">
          <p>Hi! Admin</p>
          <button
            className="border rounded-full hover:bg-gray-300 text-sm px-4 py-1 cursor-pointer transition-all"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex">
        <div className="md:w-64 w-16 border-r text-base border-gray-300 pt-4 flex flex-col transition-all duration-300">
          {sidebarLinks.map((item, index) => (
            <NavLink
              to={item.path}
              key={index}
              end
              className={({ isActive }) =>
                `flex items-center py-3 px-4 gap-3  ${
                  isActive
                    ? "border-r-4 md:border-r-[6px] bg-primary/10 border-primary"
                    : "hover:bg-gray-100/90 border-white text-gray-700"
                }`
              }
            >
              <img src={item.icon} alt="" className="w-7 h-7" />
              <p className="md:block hidden text-center">{item.name}</p>
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </>
  );
};

export default SellerLayout;
