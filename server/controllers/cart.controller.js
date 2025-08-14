import pool from "../db/connection.js";
import queryList from "../db/queries.js";

async function getCartItems(req, res) {
  const { cartId } = req.params;

  if (isNaN(cartId)) return res.status(400).json({ error: "Invalid Cart Id!" });

  try {
    const queryText = queryList.GET_CART_ITEMS;
    const queryValues = [cartId];
    const result = await pool.query(queryText, queryValues);
    const cartItems = result.rows;

    return res.status(200).json(cartItems);
  } catch (error) {
    return res.status(500).json({ error: "Failed to get cart items" });
  }
}

async function addCartItem(req, res) {
  const { cartId, productId, quantity } = req.body;

  try {
    const queryText = queryList.ADD_CART_ITEM;
    const queryValues = [cartId, productId, quantity];
    const result = await pool.query(queryText, queryValues);

    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add item to cart." });
  }
}

async function updateCartItem(req, res) {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (isNaN(itemId))
    return res.status(400).json({ error: "Invalid Cart Item Id!" });

  try {
    const queryText = queryList.UPDATE_CART_ITEM;
    const queryValues = [quantity, itemId];
    await pool.query(queryText, queryValues);

    return res.status(200).json({ message: "Cart item updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update cart" });
  }
}

async function deleteCartItem(req, res) {
  const { itemId } = req.params;

  if (isNaN(itemId))
    return res.status(400).json({ error: "Invalid Cart Item Id!" });

  try {
    const queryText = queryList.DELETE_CART_ITEM;
    const queryValues = [itemId];
    await pool.query(queryText, queryValues);

    return res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete cart item" });
  }
}

export { getCartItems, addCartItem, updateCartItem, deleteCartItem };
