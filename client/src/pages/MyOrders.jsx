import { useContext, useEffect, useState } from "react";
import { context } from "../context/AppContext";
import noOrder from "../assets/no-order.png";
import axios from "../Utils/axiosInstance.js";
import toast from "react-hot-toast";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const { navigate, user } = useContext(context);

  useEffect(() => {
    getAllOrders();
  }, []);

  const formatPaymentType = (paymentType) => {
    switch (paymentType) {
      case "cash":
        return "Cash on Delivery";
      case "paypal":
        return "PayPal";
      case "card":
        return "Bank Card";
      default:
        return paymentType;
    }
  };

  function transformOrdersData(data) {
    const ordersMap = new Map();

    for (const item of data) {
      const orderId = item.order_id;

      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: orderId,
          amount: Number(item.amount),
          deliveryFee: Number(item.delivery_fee),
          paymentType: formatPaymentType(item.payment_type),
          orderedAt: new Date(item.ordered_at).toLocaleDateString(),
          address: {
            street: item.street,
            city: item.city,
            state: item.state,
            country: item.country,
          },
          products: [],
        });
      }

      const product = {
        id: item.product_id,
        orderItemId: item.order_item_id,
        name: item.name,
        category: item.category,
        statusName: item.status_name,
        statusColor: item.status_color,
        complaintStatus: item.complaintstatus,
        price: Number(item.price),
        image: item.image,
      };

      ordersMap.get(orderId).products.push(product);
    }

    return Array.from(ordersMap.values());
  }

  async function getAllOrders() {
    setIsLoadingOrders(true);
    try {
      const { data } = await axios.get("/api/orders",);

      await new Promise((resolve) => setTimeout(resolve, 200));

      setOrders(transformOrdersData(data.orders));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingOrders(false);
    }
  }

  async function cancelOrder(orderItemId, orderId) {
    try {
      await axios.put(
        `/api/orders/item/${orderItemId}/cancel`,
        { order_id: orderId },

      );

      getAllOrders();
      toast.success("Order Cancelled");
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  }

  if (isLoadingOrders) {
    return (
      <div className="mt-32 flex justify-center items-center text-gray-500">
        <p>Loading orders...</p>
      </div>
    );
  }

  if (orders.length == 0) {
    return (
      <div className="mt-24 flex flex-col items-center justify-center text-gray-500">
        <img src={noOrder} alt="No Orders" className="w-32 h-32 opacity-80" />
        <p className="text-lg font-medium mt-4">
          You haven't placed any orders yet.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="mt-16 pb-16">
        <p className="text-2xl font-medium uppercase underline decoration-primary underline-offset-8">
          My Orders
        </p>
      </div>

      <div className="flex flex-col ">
        {orders.map((order, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-5xl"
          >
            <p className="text-sm text-gray-500 mb-3">
              <span className="text-gray-700 font-semibold">
                Shipping Address:
              </span>
              <br />
              {order.address.street}, {order.address.city},{" "}
              {order.address.state}, {order.address.country}
            </p>

            <div className="flex justify-between md:items-center text-gray-500 md:font-medium max-md:flex-col">
              <p>OrderId: {order.id}</p>
              <p>Payment: {order.paymentType}</p>
              <p className="text-gray-500">
                Delivery Fee: ${order.deliveryFee}
              </p>
              <p className="text-primary">Total Amount: ${order.amount}</p>
            </div>

            {order.products.map((product, index) => (
              <div
                key={index}
                className={`relative bg-white text-gray-500/70 ${
                  index != order.products.length - 1
                    ? "border-b border-gray-300"
                    : null
                } grid grid-cols-1 md:grid-cols-3 items-center p-4 py-5 md:gap-16 w-full max-w-5xl`}
              >
                <div className="flex items-center">
                  <div
                    className="p-4 rounded-lg cursor-pointer"
                    onClick={() => {
                      navigate(`/products/${product.category}/${product.id}`);
                    }}
                  >
                    <img
                      className="w-23 h-23 object-contain"
                      src={product.image}
                      alt={product.name}
                    />
                  </div>
                  <div className="ml-2">
                    <h2 className="text-xl font-medium text-gray-800">
                      {product.name}
                    </h2>
                    <p>Category: {product.category}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center md:ml-8">
                  <p>
                    Status:{" "}
                    <span style={{ color: product.statusColor }}>
                      {product.statusName.charAt(0).toUpperCase() +
                        product.statusName.slice(1)}
                    </span>
                  </p>
                  <p>Order Date: {order.orderedAt}</p>

                  {product.statusName === "ordered" && (
                    <button
                      onClick={() => cancelOrder(product.orderItemId, order.id)}
                      className="mt-2 px-4 py-1 border border-red-500 text-red-500 text-sm rounded hover:bg-red-50 w-fit cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}

                  {product.statusName === "delivered" &&
                    product.complaintStatus === "none" && (
                      <button
                        onClick={() =>
                          navigate(`/complaint/${product.orderItemId}`)
                        }
                        className="mt-2 px-4 py-1 border border-orange-500 text-orange-500 text-sm rounded hover:bg-orange-50 w-fit cursor-pointer"
                      >
                        Report Issue
                      </button>
                    )}
                </div>

                <p className="text-lg font-medium md:text-right">
                  Amount: ${product.price}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
export default MyOrders;
