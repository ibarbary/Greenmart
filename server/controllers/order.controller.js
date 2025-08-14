import pool from "../db/connection.js";
import queryList from "../db/queries.js";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} from "../services/email.services.js";

async function getUserOrders(req, res) {
  const { id } = req.user;
  try {
    const queryText = queryList.GET_ALL_ORDERS_BY_ID;
    const result = await pool.query(queryText, [id]);
    const orders = result.rows;

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error getting all orders:", error);
    return res.status(500).json({ error: "Failed to get all orders" });
  }
}

async function getOrderItem(req, res) {
  const { orderItemId } = req.params;

  if (isNaN(orderItemId))
    return res.status(400).json({ error: "Invalid Order Item Id!" });

  try {
    const result = await pool.query(queryList.GET_ORDER_ITEM, [orderItemId]);
    const orderItem = result.rows[0];

    return res.status(200).json(orderItem);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to get order item" });
  }
}

async function getAllOrders(req, res) {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const statusId = req.query.statusId || "";
  const from = req.query.from ? new Date(`${req.query.from}T00:00:00`) : null;
  const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999`) : null;

  try {
    let whereConditions = [];
    let queryValues = [];
    let valueIndex = 1;

    if (statusId) {
      whereConditions.push(`oi.status_id = $${valueIndex}`);
      queryValues.push(statusId);
      valueIndex++;
    }

    if (from) {
      whereConditions.push(`o.ordered_at >= $${valueIndex}`);
      queryValues.push(from);
      valueIndex++;
    }

    if (to) {
      whereConditions.push(`o.ordered_at <= $${valueIndex}`);
      queryValues.push(to);
      valueIndex++;
    }

    const where =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    queryValues.push(limit);
    queryValues.push(offset);

    const orderQuery = `
    SELECT 
      o.user_id,
      o.id as order_id,
      oi.id as order_item_id,
      oi.complaintStatus,
      o.amount,
      o.delivery_fee,
      o.payment_type,
      o.ordered_at,
      s.id as status_id,
      s.name as status_name,
      s.color as status_color,
      p.id as product_id,
      p.name,
      p.category,
      p.images[1] as image,
      oi.price,
      a.first_name,
      a.last_name,
      a.street,
      a.city,
      a.state,
      a.country,
      a.phone
    FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    JOIN products p ON oi.product_id = p.id
    JOIN addresses a ON o.address_id = a.id 
    JOIN statuses s ON oi.status_id = s.id
    ${where}
    ORDER BY o.ordered_at DESC, oi.id ASC
    LIMIT $${valueIndex} OFFSET $${valueIndex + 1};`;

    const countQuery = `
    SELECT COUNT(*) as total FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    JOIN products p ON oi.product_id = p.id
    JOIN addresses a ON o.address_id = a.id 
    JOIN statuses s ON oi.status_id = s.id
    ${where}`;

    const [ordersResult, countResult] = await Promise.all([
      pool.query(orderQuery, queryValues),
      pool.query(countQuery, queryValues.slice(0, -2)),
    ]);

    const orders = ordersResult.rows;
    const totalCount = countResult.rows[0].total;

    return res.status(200).json({ orders, totalCount });
  } catch (error) {
    console.error("Error getting all orders:", error);
    return res.status(500).json({ error: "Failed to get all orders" });
  }
}

async function createOrder(req, res) {
  const { id } = req.user;
  const {
    address_id,
    payment_type,
    cart_items,
    amount,
    delivery_fee,
    paypal_transaction_id,
  } = req.body;

  if (
    address_id == null ||
    payment_type == null ||
    amount == null ||
    delivery_fee == null ||
    !cart_items ||
    cart_items.length === 0
  )
    return res.status(400).json({ error: "All order fields are required" });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const payment_status = payment_type === "paypal" ? "paid" : "pending";
    const transaction_id = paypal_transaction_id || null;

    const delivery_paid = payment_type === "paypal" ? true : false;

    const userResult = await client.query(queryList.GET_USER, [id]);
    const user = userResult.rows[0];

    const addressResult = await client.query(queryList.GET_ADDRESS, [
      address_id,
    ]);
    const address = addressResult.rows[0];

    let queryText = queryList.CREATE_ORDER;
    let result = await client.query(queryText, [
      id,
      address_id,
      payment_type.toLowerCase(),
      amount,
      delivery_fee,
      payment_status,
      transaction_id,
      delivery_paid,
    ]);
    const orderId = result.rows[0].id;

    const insertItemPromises = [];
    const orderItems = [];

    for (const item of Object.values(cart_items)) {
      const { product, quantity } = item;

      if (!product || !quantity || quantity < 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid cart item data" });
      }

      orderItems.push({
        name: product.name,
        quantity: parseInt(quantity),
        price: parseFloat(product.offerPrice || product.price),
        image: product.image,
      });

      queryText = queryList.ADD_ORDER_ITEM;

      for (let i = 0; i < quantity; i++) {
        const insertPromise = client.query(queryList.ADD_ORDER_ITEM, [
          orderId,
          product.id,
          1, // status_id = "Ordered"
          product.price,
        ]);
        insertItemPromises.push(insertPromise);
      }
    }

    await Promise.all(insertItemPromises);
    queryText = queryList.CLEAR_USER_CART;
    result = await client.query(queryText, [id]);

    await client.query("COMMIT");

    try {
      const orderData = {
        username: user.name,
        orderId: orderId,
        orderItems: orderItems,
        address: address,
        amount: parseFloat(amount),
        deliveryFee: parseFloat(delivery_fee),
        paymentType: payment_type,
      };

      await sendOrderConfirmationEmail(user.email, orderData);
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

    return res.status(201).json({ message: "Order Placed" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  } finally {
    client.release();
  }
}

async function cancelOrderItem(req, res) {
  const { orderItemId } = req.params;
  const { order_id } = req.body;

  if (isNaN(orderItemId))
    return res.status(400).json({ error: "Invalid Order Item Id!" });

  try {
    const queryText = queryList.CANCEL_ORDER;
    await pool.query(queryText, [orderItemId, order_id]);

    return res.status(200).json({ message: "Order Cancelled Successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ error: "Failed to delete order" });
  }
}

async function updateOrderItemsStatus(req, res) {
  const { status_id, order_id, address, order_item_ids } = req.body;

  if (!status_id) {
    return res.status(400).json({ error: "status is required" });
  }

  if (!order_item_ids || order_item_ids.length == 0) {
    return res.status(400).json({ error: "order item id array is required" });
  }

  const invalidIds = order_item_ids.filter((id) => isNaN(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({ error: "Invalid order item IDs provided" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(queryList.UPDATE_ORDER_STATUS, [
      status_id,
      order_item_ids,
      order_id,
    ]);

    const itemDetailsResult = await client.query(queryList.GET_ORDERS_BY_ANY, [
      order_item_ids,
      order_id,
    ]);

    if (itemDetailsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "No order items found" });
    }

    const orderItem = itemDetailsResult.rows[0];
    const orderDeliveryPaid = orderItem.delivery_paid;
    const orderDeliveryFee = parseFloat(orderItem.delivery_fee);

    let deliveryFeeForEmail = 0;

    if (!orderDeliveryPaid) {
      deliveryFeeForEmail = orderDeliveryFee;

      if (status_id === 4) {
        // 4 for Delivered
        await client.query(queryList.UPDATE_ORDER_DELIVERY_PAID, [order_id]);
      }
    }

    await client.query("COMMIT");

    const emailContentByStatusId = {
      2: {
        getSubject: (orderId) => `Order Shipped - Order #${orderId}`,
        header: "Your order has been shipped",
      },
      3: {
        getSubject: (orderId) => `Out for Delivery - Order #${orderId}`,
        header: "Your order is out for delivery",
      },
      4: {
        getSubject: (orderId) => `Delivered - Order #${orderId}`,
        header: "Your order was delivered successfully",
      },
    };

    if (emailContentByStatusId[status_id]) {
      const firstItem = itemDetailsResult.rows[0];
      const subject = emailContentByStatusId[status_id].getSubject(order_id);
      const header = emailContentByStatusId[status_id].header;

      const groupedItems = {};

      itemDetailsResult.rows.forEach((item) => {
        const key = item.name;
        const price = parseFloat(item.price);

        if (!groupedItems[key]) {
          groupedItems[key] = {
            name: item.name,
            quantity: 1,
            price: price,
            image: item.images[0],
          };
        } else {
          groupedItems[key].quantity += 1;
          groupedItems[key].price += price;
        }
      });

      const orderItems = Object.values(groupedItems);

      const itemsSubtotal = orderItems.reduce((sum, item) => {
        return sum + item.price;
      }, 0);

      const emailAmount = itemsSubtotal + deliveryFeeForEmail;

      try {
        const orderData = {
          statusId: status_id,
          subject,
          headerMessage: header,
          orderId: order_id,
          orderItems: orderItems,
          address: address,
          amount: parseFloat(emailAmount),
          deliveryFee: parseFloat(deliveryFeeForEmail),
          paymentType: firstItem.payment_type,
        };

        await sendOrderStatusEmail(firstItem.email, orderData);
      } catch (emailError) {
        console.error("Failed to send order status email:", emailError);
      }
    }

    return res.status(200).json({
      message: `Successfully updated status of ${orderResult.rowCount} order items`,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error updating order items status:", error);
    return res
      .status(500)
      .json({ error: "Failed to update order items status" });
  } finally {
    client.release();
  }
}

export {
  getUserOrders,
  getOrderItem,
  getAllOrders,
  cancelOrderItem,
  createOrder,
  updateOrderItemsStatus,
};
