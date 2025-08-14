import pool from "../db/connection.js";
import queryList from "../db/queries.js";

async function getAllStatuses(req, res) {
  try {
    const queryText = queryList.GET_ALL_STATUSES;
    const result = await pool.query(queryText);
    const statuses = result.rows;

    return res.status(200).json({ statuses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to return statuses" });
  }
}

export { getAllStatuses };
