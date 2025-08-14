import { useContext, useEffect, useState } from "react";
import leftArrow from "../assets/green_left_arrow.svg";
import cross from "../assets/cross.png";
import edit from "../assets/edit.png";
import deleteBin from "../assets/deleteBin.png";
import emptyCart from "../assets/emptyCart.png";
import { context } from "../context/AppContext";
import toast from "react-hot-toast";
import axios from "../Utils/axiosInstance.js";

const Cart = () => {
  const [showAddress, setShowAddress] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState();
  const [paymentOption, setPaymentOption] = useState("cash");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const {
    user,
    setShowUserLogin,
    addresses,
    setAddresses,
    selectedAddress,
    setSelectedAddress,
    navigate,
    totalItems,
    cart,
    setCart,
    addToCart,
    removeFromCart,
    eraseFromCart,
    getCartTotalCost,
  } = useContext(context);

  const deliveryFee = 30;
  const FreeDeliveryAmount = 200;

  if (Object.keys(cart).length === 0) {
    return (
      <div className="mt-24 flex flex-col items-center justify-center text-gray-500">
        <img
          src={emptyCart}
          alt="Empty Cart"
          className="w-32 h-32 opacity-80"
        />
        <p className="text-lg font-medium mt-4">Your cart is empty!</p>

        <button
          onClick={() => navigate("/products")}
          className="mt-10 px-4 py-2 bg-primary text-white rounded hover:bg-primary-darker transition cursor-pointer"
        >
          Go Shopping
        </button>
      </div>
    );
  }

  async function deleteAddress() {
    try {
      if (user) {
        setIsDeletingAddress(true);

        await axios.delete(
          `/api/addresses/${addressToDelete.id}`
        );

        setAddresses((prevAddresses) => {
          const updated = prevAddresses.filter(
            (a) => a.id != addressToDelete.id
          );

          if (selectedAddress?.id === addressToDelete.id) {
            setSelectedAddress(updated[0] || null);
          }

          return updated;
        });
      } else {
        localStorage.removeItem("guestAddresses");
        setAddresses([]);
        setSelectedAddress(null);
      }

      setAddressToDelete("");
      setDeleteConfirmation(false);
      toast.dismiss();
      toast.success("Address deleted");
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingAddress(false);
    }
  }

  async function placeOrder() {
    if (user) {
      if (paymentOption === "paypal") {
        navigate("/paypal-checkout", {
          state: {
            orderData: {
              address_id: selectedAddress.id,
              payment_type: paymentOption,
              amount:
                getCartTotalCost() +
                (getCartTotalCost() > FreeDeliveryAmount ? 0 : deliveryFee),
              delivery_fee:
                getCartTotalCost() > FreeDeliveryAmount ? 0 : deliveryFee,
              cart_items: cart,
            },
          },
        });
        return;
      }

      try {
        setIsPlacingOrder(true);
        await axios.post("/api/orders", {
          address_id: selectedAddress.id,
          payment_type: paymentOption,
          amount:
            getCartTotalCost() +
            (getCartTotalCost() > FreeDeliveryAmount ? 0 : deliveryFee),
          delivery_fee:
            getCartTotalCost() > FreeDeliveryAmount ? 0 : deliveryFee,
          cart_items: cart,
        });

        toast.success("Order Placed");

        await new Promise((resolve) => setTimeout(resolve, 200));

        navigate("/my-orders");
        setCart({});
      } catch (error) {
        console.error(error);
        toast.error("Failed to place order");
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      setShowUserLogin(true);
    }
  }

  return (
    <>
      {deleteConfirmation ? (
        <div
          onClick={() => {
            setDeleteConfirmation(false);
          }}
          className="fixed top-0 bottom-0 left-0 right-0 z-30 flex items-center justify-center text-sm bg-black/50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center bg-white shadow-md rounded-xl py-6 px-5 md:w-[460px] w-[370px] border border-gray-300"
          >
            <div className="flex items-center justify-center p-4 bg-red-100 rounded-full">
              <img className="w-5 h-5" src={deleteBin} alt="delete" />
            </div>
            <h2 className="text-gray-900 font-semibold mt-4 text-xl">
              Are you sure?
            </h2>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Do you really want to delete this address?
            </p>
            <div className="flex items-center justify-center gap-4 mt-5 w-full">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmation(false);
                }}
                className="w-full md:w-36 h-10 rounded-md border border-gray-300 bg-white text-gray-600 font-medium text-sm hover:bg-gray-100 active:scale-95 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAddress}
                disabled={isDeletingAddress}
                className="w-full md:w-36 h-10 rounded-md text-white bg-red-600 font-medium text-sm hover:bg-red-700 active:scale-95 cursor-pointer transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDeletingAddress ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col md:flex-row py-16 w-full mx-auto">
        <div className="flex-1 max-w-4xl">
          <h1 className="text-3xl font-medium mb-6">
            Shopping Cart{" "}
            <span className="text-sm text-primary">{totalItems} Items</span>
          </h1>

          <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
            <p className="text-left">Product Details</p>
            <p className="text-center">Total Price</p>
            <p className="text-center">Remove</p>
          </div>

          {Object.entries(cart).map(([productId, cartItem]) => {
            const { product, quantity } = cartItem;
            const totalPrice = quantity * product.price;

            return (
              <div
                key={productId}
                className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3"
              >
                <div className="flex items-center md:gap-6 gap-3">
                  <div
                    onClick={() => {
                      navigate(`/products/${product.category}/${product.id}`);
                    }}
                    className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded"
                  >
                    <img
                      className="max-w-full h-full object-contain"
                      src={product.image}
                      alt={product.name}
                    />
                  </div>
                  <div>
                    <p className="md:block font-semibold">{product.name}</p>

                    <div className="font-normal text-gray-500/70">
                      <div className="flex items-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          QTY:
                        </p>
                        <div className="flex items-center justify-center gap-2 md:w-24 w-20 h-9 rounded">
                          <button
                            onClick={() =>
                              quantity > 1 && removeFromCart(product.id)
                            }
                            disabled={quantity <= 1}
                            className={`text-md px-1 rounded transition-all ease-in-out ${
                              quantity > 1
                                ? "text-neutral-700 hover:text-primary cursor-pointer"
                                : "text-neutral-300 cursor-auto"
                            }`}
                          >
                            -
                          </button>
                          <span className="min-w-[1.5rem] text-center text-sm font-medium text-gray-700">
                            {quantity}
                          </span>

                          <button
                            onClick={() => addToCart(product)}
                            className="text-md px-1 rounded transition-all ease-in-out text-neutral-700 hover:text-primary cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center">${totalPrice}</p>
                <button
                  className="cursor-pointer mx-auto"
                  onClick={() => {
                    eraseFromCart(product.id);
                  }}
                >
                  <img className="w-5" src={cross} alt="" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => {
              navigate("/products");
            }}
            className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium"
          >
            <img
              className="transition group-hover:-translate-x-1/4"
              src={leftArrow}
              alt="left Arrow"
            />
            Continue Shopping
          </button>
        </div>

        <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
          <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
          <hr className="border-gray-300 my-5" />

          <div className="mb-6">
            <p className="text-sm font-medium uppercase">Delivery Address</p>
            <div className="relative flex justify-between items-start mt-2">
              <p className="text-gray-500">
                {selectedAddress
                  ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}`
                  : "No Address Found"}
              </p>
              <button
                onClick={() => setShowAddress(!showAddress)}
                className="text-primary hover:underline cursor-pointer"
              >
                Change
              </button>
              {showAddress && (
                <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full">
                  {addresses?.map((address, index) => {
                    return (
                      <div
                        className="flex justify-between items-center gap-3"
                        key={index}
                      >
                        <p
                          onClick={() => {
                            setSelectedAddress(address);
                            setShowAddress(false);
                          }}
                          className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer truncate"
                        >
                          {`${address.street}, ${address.city}, ${address.state}, ${address.country}`}
                        </p>

                        <div className="flex items-center gap-2 pr-2">
                          <img
                            className="w-4 h-4 cursor-pointer"
                            src={deleteBin}
                            alt="delete"
                            onClick={() => {
                              setDeleteConfirmation(true);
                              setAddressToDelete(address);
                            }}
                          />
                          <img
                            className="w-4 h-4 cursor-pointer"
                            src={edit}
                            alt="edit"
                            onClick={() => {
                              navigate(`/edit-address/${address.id}`);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <p
                    onClick={() => navigate("/add-address")}
                    className="text-primary text-center cursor-pointer p-2 hover:bg-indigo-500/10"
                  >
                    Add address
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm font-medium uppercase mt-6">Payment Method</p>

            <select
              className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none"
              onChange={(e) => setPaymentOption(e.target.value)}
            >
              <option value="cash">Cash On Delivery</option>
              <option value="paypal">Paypal</option>
            </select>
          </div>

          <hr className="border-gray-300" />

          <div className="text-gray-500 mt-4 space-y-2">
            <p className="flex justify-between">
              <span>Price</span>
              <span>${getCartTotalCost()}</span>
            </p>
            <div className="flex flex-col">
              <p className="flex justify-between">
                <span>Delivery Fee</span>
                {getCartTotalCost() > FreeDeliveryAmount ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span>${deliveryFee}</span>
                )}
              </p>
              <p className="text-xs text-black mt-1">
                Orders over ${FreeDeliveryAmount} get free delivery
              </p>
            </div>
            <p className="flex justify-between text-lg font-medium mt-3">
              <span>Total Amount</span>
              <span>
                $
                {getCartTotalCost() +
                  (getCartTotalCost() > FreeDeliveryAmount ? 0 : deliveryFee)}
              </span>
            </p>
          </div>

          <button
            className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-darker transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={() => {
              if (!user) {
                setShowUserLogin(true);
                toast.dismiss();
                toast.error("Please log in to place an order");
              } else if (!selectedAddress) {
                toast.dismiss();
                toast.error("Please provide delivery address");
              } else if (!isPlacingOrder) {
                placeOrder();
              }
            }}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder
              ? "Placing Order..."
              : paymentOption === "cash"
              ? "Place Order"
              : "Proceed to Checkout"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Cart;
