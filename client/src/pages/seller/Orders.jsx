import axios from "../../Utils/axiosInstance.js";
import { useEffect, useState } from "react";
import phone from "../../assets/phone.png";
import toast from "react-hot-toast";
import Pagination from "../../components/Pagination";

const Orders = () => {
  const [groupedOrders, setGroupedOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [orderTotalCount, setOrderTotalCount] = useState(0);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [batchStatusId, setBatchStatusId] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const ORDER_ITEMS_PER_PAGE = 100;

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [orderCurrentPage]);

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

  function formatDateTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  }

  function getAllowedStatusTransitions(currentStatusName) {
    const transitions = {
      ordered: ["shipped", "cancelled"],
      shipped: ["out for delivery", "returned"],
      "out for delivery": ["delivered"],
      delivered: ["refunded"],
      returned: [],
      cancelled: [],
    };

    return transitions[currentStatusName.toLowerCase()] || [];
  }

  function deriveOrderStatus(orderItems) {
    const statusCount = {};

    for (const item of orderItems) {
      const status = statuses.find((s) => s.id === item.statusId);
      if (!status) continue;

      const name = status.name.toLowerCase();
      statusCount[name] = (statusCount[name] || 0) + 1;
    }

    const statusPriority = {
      delivered: 4,
      "out for delivery": 3,
      shipped: 2,
      processing: 1,
    };

    const dominantStatus = Object.entries(statusCount).sort((a, b) => {
      const [statusA, countA] = a;
      const [statusB, countB] = b;

      if (countA !== countB) return countB - countA;
      return (statusPriority[statusB] || 0) - (statusPriority[statusA] || 0);
    })[0]?.[0];

    return dominantStatus;
  }

  function getOrderStatusColor(orderItems) {
    const statusCount = {};

    for (const item of orderItems) {
      const status = statuses.find((s) => s.id === item.statusId);
      if (!status) continue;

      const name = status.name.toLowerCase();
      statusCount[name] = (statusCount[name] || 0) + 1;
    }

    const statusPriority = {
      delivered: 4,
      "out for delivery": 3,
      shipped: 2,
      processing: 1,
    };

    const dominantStatusName = Object.entries(statusCount).sort((a, b) => {
      const [statusA, countA] = a;
      const [statusB, countB] = b;

      if (countA !== countB) return countB - countA;
      return (statusPriority[statusB] || 0) - (statusPriority[statusA] || 0);
    })[0]?.[0];

    const dominantStatus = statuses.find(
      (s) => s.name.toLowerCase() === dominantStatusName
    );

    return dominantStatus?.color;
  }

  function transformOrdersData(data) {
    const ordersMap = new Map();

    for (const row of data) {
      const orderId = row.order_id;

      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: orderId,
          userId: row.user_id,
          amount: parseFloat(row.amount),
          deliveryFee: parseFloat(row.delivery_fee),
          paymentType: formatPaymentType(row.payment_type),
          orderedAt: formatDateTime(row.ordered_at),
          address: {
            firstName: row.first_name,
            lastName: row.last_name,
            street: row.street,
            city: row.city,
            state: row.state,
            country: row.country,
            phone: row.phone,
          },
          products: [],
        });
      }

      const order = ordersMap.get(orderId);
      order.products.push({
        id: row.product_id,
        orderItemId: row.order_item_id,
        orderId: row.order_id,
        name: row.name,
        category: row.category,
        price: parseFloat(row.price),
        image: row.image,
        statusId: row.status_id,
        statusName: row.status_name,
        statusColor: row.status_color,
      });
    }

    return Array.from(ordersMap.values());
  }

  async function fetchStatuses() {
    try {
      const { data } = await axios.get("/api/statuses");
      setStatuses(data.statuses);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchOrders(currentPage = orderCurrentPage) {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("'From' date must be earlier than 'To' date.");
      return;
    }

    if (currentPage == 1) setOrderCurrentPage(currentPage);

    setIsLoadingOrders(true);
    try {
      const status = statuses.find((s) => s.name === selectedStatus);

      const query = new URLSearchParams({
        limit: ORDER_ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ORDER_ITEMS_PER_PAGE,
        statusId: status?.id || "",
        from: fromDate,
        to: toDate,
      }).toString();

      const { data } = await axios.get(`/api/orders/all?${query}`);

      await new Promise((resolve) => setTimeout(resolve, 300));

      setGroupedOrders(transformOrdersData(data.orders));
      setOrderTotalCount(data.totalCount);
      setOrderTotalPages(Math.ceil(data.totalCount / ORDER_ITEMS_PER_PAGE));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingOrders(false);
    }
  }

  const toggleSelectItem = (itemId) => {
    setSelectedOrderItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAllOrderItems = (orderItems) => {
    const orderItemIds = orderItems.map((item) => item.orderItemId);
    const allSelected = orderItemIds.every((id) =>
      selectedOrderItems.includes(id)
    );

    if (allSelected) {
      setSelectedOrderItems((prev) =>
        prev.filter((id) => !orderItemIds.includes(id))
      );
    } else {
      setSelectedOrderItems((prev) => [...new Set([...prev, ...orderItemIds])]);
    }
  };

  async function updateBatchOrderItemStatus(
    orderId,
    statusId,
    address,
    amount,
    paymentType
  ) {
    if (selectedOrderItems.length === 0) {
      toast.error("Please select at least one item to update");
      return;
    }

    setUpdatingStatus(true);

    try {
      await axios.put(`/api/orders/item/status`, {
        order_item_ids: selectedOrderItems,
        status_id: statusId,
        order_id: orderId,
        address,
        amount,
        paymentType,
      });

      toast.success(`Updated Items Status`);

      setEditingOrderId(null);
      setSelectedOrderItems([]);
      setBatchStatusId("");

      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setUpdatingStatus(false);
    }
  }

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setSelectedOrderItems([]);
    setBatchStatusId("");
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-wrap gap-4 mt-4 md:pl-10 pl-4 items-center">
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="fromDate" className="text-sm">
            From:
          </label>
          <input
            id="fromDate"
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="toDate" className="text-sm">
            To:
          </label>
          <input
            id="toDate"
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            fetchOrders(1);
          }}
          className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-primary-darker cursor-pointer transition-all"
        >
          Apply Filters
        </button>
      </div>

      <div className="md:p-10 p-4 space-y-4">
        <div className="flex items-center justify-between pb-4 text-lg font-medium max-w-5xl w-full">
          <h2>All Orders</h2>
          <span className="text-sm text-gray-500">
            {orderTotalCount} items found
          </span>
        </div>

        {isLoadingOrders
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-5 p-5 max-w-5xl border border-gray-300 rounded-md"
              >
                <div className="space-y-2">
                  <div className="flex gap-3 items-center">
                    <div className="bg-gray-300 rounded w-10 h-10"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-300 rounded w-32"></div>
                      <div className="h-2 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                  <div className="h-2 bg-gray-200 rounded w-40"></div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-5 w-12 bg-gray-300 rounded"></div>
                </div>

                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                  <div className="h-2 bg-gray-200 rounded w-28"></div>
                </div>
              </div>
            ))
          : groupedOrders.map((order) => (
              <div
                key={order.id}
                className="relative flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:items-start mb-3 gap-5 px-10 py-15 max-w-5xl rounded-md border border-gray-300 text-gray-800"
              >
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                    Order #{order.id}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    Customer #{order.userId}
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <span
                    className="text-sm font-semibold px-2 py-1 rounded"
                    style={{
                      color: getOrderStatusColor(order.products),
                    }}
                  >
                    {deriveOrderStatus(order.products).toUpperCase()}
                  </span>

                  <button
                    className="text-xs text-blue-600 underline cursor-pointer"
                    onClick={() => {
                      if (editingOrderId === order.id) {
                        handleCancelEdit();
                      } else {
                        setEditingOrderId(order.id);
                        setSelectedOrderItems([]);
                        setBatchStatusId("");
                      }
                    }}
                  >
                    {editingOrderId === order.id ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editingOrderId === order.id && (
                  <div className="col-span-full mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() =>
                          toggleSelectAllOrderItems(order.products)
                        }
                        className="text-sm text-blue-600 underline cursor-pointer"
                      >
                        {order.products.every((item) =>
                          selectedOrderItems.includes(item.orderItemId)
                        )
                          ? "Deselect All"
                          : "Select All"}
                      </button>

                      {selectedOrderItems.length > 0 && (
                        <>
                          <span className="text-sm text-gray-600">
                            {selectedOrderItems.length} items selected
                          </span>

                          <select
                            value={batchStatusId}
                            onChange={(e) => setBatchStatusId(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm outline-none cursor-pointer"
                          >
                            <option value="">Select new status</option>
                            {statuses.map((status) => {
                              const currentItemStatuses = order.products
                                .filter((p) =>
                                  selectedOrderItems.includes(p.orderItemId)
                                )
                                .map((p) =>
                                  statuses
                                    .find((s) => s.id === p.statusId)
                                    ?.name.toLowerCase()
                                );

                              const allSameStatus = currentItemStatuses.every(
                                (status) => status === currentItemStatuses[0]
                              );

                              const allowed =
                                allSameStatus && currentItemStatuses[0]
                                  ? getAllowedStatusTransitions(
                                      currentItemStatuses[0]
                                    )
                                  : statuses.map((s) => s.name.toLowerCase());

                              const isDisabled = !allowed.includes(
                                status.name.toLowerCase()
                              );

                              return (
                                <option
                                  key={status.id}
                                  value={status.id}
                                  disabled={isDisabled}
                                  className={isDisabled ? "text-gray-400" : ""}
                                >
                                  {status.name}
                                </option>
                              );
                            })}
                          </select>

                          <button
                            onClick={() =>
                              updateBatchOrderItemStatus(
                                order.id,
                                parseInt(batchStatusId),
                                order.address,
                                order.amount,
                                order.paymentType,
                                order.products
                              )
                            }
                            disabled={!batchStatusId}
                            className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-darker disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {updatingStatus ? "Updating..." : "Update Status"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {order.products.map((product, index) => (
                    <div key={index} className="flex items-center gap-3 pb-2">
                      {editingOrderId === order.id && (
                        <input
                          type="checkbox"
                          checked={selectedOrderItems.includes(
                            product.orderItemId
                          )}
                          onChange={() => toggleSelectItem(product.orderItemId)}
                          className="w-4 h-4 text-blue-600"
                        />
                      )}

                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-18 h-18 rounded object-contain"
                      />
                      <div className="text-sm">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          Item ID: #{product.orderItemId}
                        </p>
                        <p className="text-xs text-gray-500">
                          Price: ${product.price}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          Status:
                          <span
                            style={{
                              color: product.statusColor,
                              fontWeight: "bold",
                            }}
                          >
                            {statuses
                              .find((s) => s.id === product.statusId)
                              ?.name.toUpperCase()}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm leading-relaxed md:col-start-2 self-center">
                  <p className="font-medium mb-1">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p>
                    {order.address.street}, {order.address.city},{" "}
                    {order.address.state}, {order.address.country}
                  </p>
                  <p className="mt-1 flex items-center gap-2">
                    <img src={phone} alt="Phone number" className="w-4 h-4" />
                    <span>{order.address.phone}</span>
                  </p>
                </div>

                <div className="text-center md:col-start-3 self-center">
                  <p className="text-lg font-semibold text-black/80">
                    ${order.amount}
                  </p>
                </div>

                <div className="flex flex-col text-sm md:col-start-4 self-center">
                  <p>
                    <span className="font-medium">Method:</span>{" "}
                    {order.paymentType}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {order.orderedAt}
                  </p>
                  <p>
                    <span className="font-medium">Delivery Fee:</span> $
                    {order.deliveryFee}
                  </p>
                </div>
              </div>
            ))}
      </div>

      {orderTotalPages > 1 ? (
        <div className="mb-10 md:px-10 px-4">
          <div className="flex justify-between">
            <Pagination
              currentPage={orderCurrentPage}
              totalPages={orderTotalPages}
              setCurrentPage={setOrderCurrentPage}
            />
            <div className="text-sm text-gray-500">
              Page {orderCurrentPage} of {orderTotalPages}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Orders;
