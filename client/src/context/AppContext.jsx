import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios, {
  setAxiosLogout,
  setAxiosNavigate,
} from "../Utils/axiosInstance.js";

export const context = createContext();

function AppContext({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);

  const [showUserLogin, setShowUserLogin] = useState(false);
  const [showUserSignup, setShowUserSignup] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const [ordersCount, setOrdersCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(
    parseInt(sessionStorage.getItem("currentPage")) || 1
  );
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);

  const [cart, setCart] = useState({}); // productId → { product, quantity }
  const [totalItems, setTotalItems] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);

  const PRODUCTS_PER_PAGE = 50;

  useEffect(() => {
    setAxiosNavigate(navigate);
    setAxiosLogout(handleLogout);
  }, [navigate]);

  useEffect(() => {
    const total = Object.values(cart).reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    setTotalItems(total);
  }, [cart]);

  function restore() {
    setCart({});
    setAddresses([]);
    setSelectedAddress(null);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalProducts(0);
  }

  function handleLogout() {
    restore();
    setUser(null);
    navigate("/");
  }

  async function loadCartItems() {
    if (isSeller) return;

    try {
      const { data } = await axios.get(`/api/cart/${user.cartId}`);

      const updatedCart = {};
      for (const item of data) {
        updatedCart[item.product_id] = {
          cartItemId: item.id,
          product: {
            id: item.product_id,
            name: item.name,
            category: item.category,
            price: item.offerprice || item.price,
            image: item.images[0],
          },
          quantity: item.quantity,
        };
      }

      setCart(updatedCart);
    } catch (error) {
      console.error("Failed to load cart:", error);
    }
  }

  async function checkLogin() {
    if (isCheckingAuth) return;

    setIsCheckingAuth(true);
    try {
      const { data } = await axios.get("/api/auth/verify");

      if (data?.user?.type == "admin") setIsSeller(true);
      setUser(data.user);
    } catch (error) {
      console.log(error.response?.data?.error);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  }

  useEffect(() => {
    if (user) {
      const syncUserData = async () => {
        if (user.type === "admin") {
          setCart({});
          setAddresses([]);
          setSelectedAddress(null);

          localStorage.removeItem("guestCart");
          localStorage.removeItem("guestAddresses");

          return;
        }

        if (localStorage.getItem("guestCart")) {
          const guestCart = JSON.parse(localStorage.getItem("guestCart"));

          try {
            for (const productId in guestCart) {
              const item = guestCart[productId];
              await axios.post("/api/cart", {
                cartId: user.cartId,
                productId: item.product.id,
                quantity: item.quantity,
              });
            }
            localStorage.removeItem("guestCart");
          } catch (error) {
            console.error("Failed to sync guest cart", error);
          }
        }

        if (localStorage.getItem("guestAddresses")) {
          const guestAddresses = JSON.parse(
            localStorage.getItem("guestAddresses")
          );

          if (guestAddresses.length > 0) {
            const address = {
              first_name: guestAddresses[0].first_name,
              last_name: guestAddresses[0].last_name,
              email: user?.email,
              phone: guestAddresses[0].phone,
              street: guestAddresses[0].street,
              city: guestAddresses[0].city,
              state: guestAddresses[0].state,
              country: guestAddresses[0].country,
            };

            try {
              await axios.post("/api/addresses", address);
              localStorage.removeItem("guestAddresses");
            } catch (error) {
              console.error("Failed to sync guest address", error);
            }
          }
        }

        await Promise.all([loadCartItems(), fetchAddresses()]);
      };

      syncUserData();
    } else {
      const localCart = localStorage.getItem("guestCart");
      if (localCart) {
        setCart(JSON.parse(localCart));
      } else {
        setCart({});
      }

      const localAddresses = localStorage.getItem("guestAddresses");
      if (localAddresses) {
        const addresses = JSON.parse(localAddresses);
        setAddresses(addresses);
        setSelectedAddress(addresses[0]);
      } else {
        setAddresses([]);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
    checkLogin();
  }, []);

  useEffect(() => {
    if (addresses.length == 1) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses]);

  function getCartTotalCost() {
    let totalCost = 0;
    for (const { product, quantity } of Object.values(cart)) {
      totalCost += quantity * product.price;
    }
    return totalCost;
  }

  async function fetchCategories() {
    try {
      const { data } = await axios.get("/api/categories");
      setCategories(data.categories);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchAddresses() {
    try {
      const { data } = await axios.get("/api/addresses", {
        withCredentials: true,
      });
      setAddresses(data.addresses);
      setSelectedAddress(data.addresses[0]);
    } catch (error) {
      console.error(error);
    }
  }

  async function addToCart(product) {
    if (user) {
      const existingItem = cart[product.id];

      if (existingItem) {
        try {
          await axios.put(`/api/cart/${existingItem.cartItemId}`, {
            quantity: existingItem.quantity + 1,
          });

          setCart((prevCart) => ({
            ...prevCart,
            [product.id]: {
              ...prevCart[product.id],
              quantity: prevCart[product.id].quantity + 1,
            },
          }));

          toast.dismiss();
          toast.success("Added to Cart");
        } catch (error) {
          console.error(error);
          toast.dismiss();
          toast.error("Failed to add to cart");
        }
      } else {
        try {
          const { data } = await axios.post("/api/cart", {
            cartId: user.cartId,
            productId: product.id,
            quantity: 1,
          });

          const newItem = {
            cartItemId: data.id,
            product: {
              id: product.id,
              name: product.name,
              category: product.category,
              price: product.offerprice || product.price,
              image: product.images[0],
            },
            quantity: 1,
          };

          setCart((prevCart) => ({
            ...prevCart,
            [product.id]: newItem,
          }));

          toast.dismiss();
          toast.success("Added to cart");
        } catch (error) {
          console.error(error);
          toast.dismiss();
          toast.error("Failed to add to cart");
        }
      }
    } else {
      setCart((prevCart) => {
        const existing = prevCart[product.id];

        const updated = {
          ...prevCart,
          [product.id]: existing
            ? {
                ...existing,
                quantity: existing.quantity + 1,
              }
            : {
                product: {
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  price: product.offerprice || product.price,
                  image: product.images[0],
                },
                quantity: 1,
              },
        };

        localStorage.setItem("guestCart", JSON.stringify(updated));
        toast.dismiss();
        toast.success("Added to cart");
        return updated;
      });
    }
  }

  async function removeFromCart(productId) {
    const item = cart[productId];
    if (!item) return;

    if (user) {
      try {
        if (item.quantity > 1) {
          await axios.put(`/api/cart/${item.cartItemId}`, {
            quantity: item.quantity - 1,
          });

          setCart((prevCart) => ({
            ...prevCart,
            [productId]: {
              ...prevCart[productId],
              quantity: prevCart[productId].quantity - 1,
            },
          }));
        } else {
          await axios.delete(`/api/cart/${item.cartItemId}`);

          setCart((prevCart) => {
            const updated = { ...prevCart };
            delete updated[productId];
            return updated;
          });
        }

        toast.dismiss();
        toast.success("Removed from Cart");
      } catch (error) {
        console.error(error);
        toast.dismiss();
        toast.error("Failed to remove from cart");
      }
    } else {
      setCart((prevCart) => {
        const updated = { ...prevCart };

        if (updated[productId].quantity > 1) {
          updated[productId] = {
            ...updated[productId],
            quantity: updated[productId].quantity - 1,
          };
        } else {
          delete updated[productId];
        }

        localStorage.setItem("guestCart", JSON.stringify(updated));
        toast.dismiss();
        toast.success("Removed from Cart");

        return updated;
      });
    }
  }

  async function eraseFromCart(productId) {
    const item = cart[productId];
    if (!item) return;

    if (user) {
      try {
        await axios.delete(`/api/cart/${item.cartItemId}`);

        setCart((prevCart) => {
          const updated = { ...prevCart };
          delete updated[productId];
          return updated;
        });

        toast.dismiss();
        toast.success("Item Removed from Cart");
      } catch (error) {
        console.error(error);
        toast.dismiss();
        toast.error("Failed to remove from Cart");
      }
    } else {
      setCart((prevCart) => {
        const updated = { ...prevCart };
        delete updated[productId];
        localStorage.setItem("guestCart", JSON.stringify(updated));
        toast.dismiss();
        toast.success("Item Removed from Cart");
        return updated;
      });
    }
  }

  return (
    <context.Provider
      value={{
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        showUserLogin,
        setShowUserLogin,
        showUserSignup,
        setShowUserSignup,
        ordersCount,
        setOrdersCount,
        products,
        setProducts,
        cart,
        setCart,
        addToCart,
        removeFromCart,
        eraseFromCart,
        totalItems,
        categories,
        getCartTotalCost,
        selectedAddress,
        setSelectedAddress,
        addresses,
        setAddresses,
        handleLogout,
        restore,
        PRODUCTS_PER_PAGE,
        isLoadingProducts,
        setIsLoadingProducts,
        totalPages,
        setTotalPages,
        currentPage,
        setCurrentPage,
        totalProducts,
        setTotalProducts,
      }}
    >
      {children}
    </context.Provider>
  );
}
export default AppContext;
