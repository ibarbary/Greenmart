import pool from "../db/connection.js";
import queryList from "../db/queries.js";

async function getAddresses(req, res) {
  const { id } = req.user;
  try {
    const queryText = queryList.GET_USER_ADDRESSES;
    const queryValues = [id];
    const result = await pool.query(queryText, queryValues);
    const addresses = result.rows;

    return res.status(200).json({ addresses });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get addresses" });
  }
}

async function addAddress(req, res) {
  const { first_name, last_name, phone, street, city, state, country } =
    req.body;

  const { id } = req.user;

  if (
    !first_name ||
    !last_name ||
    !phone ||
    !street ||
    !city ||
    !state ||
    !country
  )
    return res.status(400).json({ error: "All Address Fields are required" });

  try {
    const queryText = queryList.ADD_ADDRESS;
    const queryValues = [
      id,
      first_name,
      last_name,
      phone,
      street,
      city,
      state,
      country,
    ];

    const result = await pool.query(queryText, queryValues);

    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add address" });
  }
}

async function updateAddress(req, res) {
  const { id } = req.user;
  const { addressId } = req.params;
  const { first_name, last_name, phone, street, city, state, country } =
    req.body;

  try {
    const queryText = queryList.UPDATE_ADDRESS;
    const queryValues = [
      first_name,
      last_name,
      phone,
      street,
      city,
      state,
      country,
      addressId,
      id,
    ];

    await pool.query(queryText, queryValues);

    return res.json({ message: "Address updated" });
  } catch (err) {
    console.error("Error updating address:", err);
    return res.status(500).json({ error: "Failed to update address" });
  }
}

async function deleteAddress(req, res) {
  const { id } = req.user;
  const { addressId } = req.params;

  try {
    const queryText = queryList.DELETE_ADDRESS;
    const queryValues = [addressId, id];

    await pool.query(queryText, queryValues);

    return res.json({ message: "Address deleted" });
  } catch (err) {
    console.error("Error deleting address:", err);
    return res.status(500).json({ error: "Failed to delete address" });
  }
}

export { getAddresses, addAddress, updateAddress, deleteAddress };
