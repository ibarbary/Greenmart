import pool from "../db/connection.js";
import queryList from "../db/queries.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function addComplaint(req, res) {
  const { orderItemId, orderId, userId, description } = req.body;
  const image = req.file;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let imageUrl = "";
    if (image) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "complaints",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" },
            ],
            timeout: 60000,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    await client.query(queryList.ADD_COMPLAINT, [
      parseInt(orderItemId),
      parseInt(userId),
      description,
      imageUrl,
    ]);

    await client.query(queryList.UPDATE_ORDER_STATUS, [
      6,
      [orderItemId],
      orderId,
    ]);

    await client.query("COMMIT");

    return res
      .status(201)
      .json({ message: "Your complaint has been submitted" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    return res.status(500).json({ error: "Failed to add complaint" });
  } finally {
    client.release();
  }
}

async function getComplaints(req, res) {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const status = req.query.status || "";
  const from = req.query.from ? new Date(`${req.query.from}T00:00:00`) : null;
  const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999`) : null;
  try {
    let whereConditions = [];
    let queryValues = [];
    let valueIndex = 1;

    if (status) {
      whereConditions.push(`c.status = $${valueIndex}`);
      queryValues.push(status);
      valueIndex++;
    }

    if (from) {
      whereConditions.push(`c.created_at >= $${valueIndex}`);
      queryValues.push(from);
      valueIndex++;
    }

    if (to) {
      whereConditions.push(`c.created_at <= $${valueIndex}`);
      queryValues.push(to);
      valueIndex++;
    }

    const where =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    queryValues.push(limit);
    queryValues.push(offset);

    const complaintQuery = `
    SELECT
        c.id,
        c.description,
        c.image,
        c.status,
        c.created_at,
        c.order_item_id as "orderItemId",
        p."name" AS "productName",
        p.category AS "productCategory",
        p.images[1] AS "productImage",
        oi.price AS "productPrice",
        o.id AS "orderId",
        o.user_id AS "userId"
    FROM complaints c
    JOIN order_items oi ON c.order_item_id = oi.id
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    ${where}
    ORDER BY c.created_at DESC
    LIMIT $${valueIndex} OFFSET $${valueIndex + 1};`;

    const countQuery = `
    SELECT COUNT(*) as total FROM complaints c
    JOIN order_items oi ON c.order_item_id = oi.id
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    ${where}`;

    const [complaintsResult, countResult] = await Promise.all([
      pool.query(complaintQuery, queryValues),
      pool.query(countQuery, queryValues.slice(0, -2)),
    ]);

    const complaints = complaintsResult.rows;
    const totalCount = countResult.rows[0].total;

    return res.status(200).json({ complaints, totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to get all complaints" });
  }
}

async function updateComplaintStatus(req, res) {
  const { id } = req.params;
  const { status, userId } = req.body;

  if (isNaN(id)) return res.status(400).json({ error: "Invalid Complaint Id" });

  if (status.toLowerCase() != "accepted" && status.toLowerCase() != "rejected")
    return res.status(400).json({ error: "Invalid Complaint Status" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(queryList.UPDATE_COMPLAINT_STATUS, [
      status,
      parseInt(id),
      userId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const orderItemId = result.rows[0].order_item_id;
    const orderStatusId = status == "accepted" ? 7 : 4;

    await client.query(queryList.UPDATE_ORDER_AND_COMPLAINT_STATUS, [
      orderStatusId,
      status,
      orderItemId,
    ]);

    await client.query("COMMIT");

    return res.status(200).json({ message: "Complaint Status Updated" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    return res.status(500).json({ error: "Failed to update complaint status" });
  } finally {
    client.release();
  }
}

export { addComplaint, getComplaints, updateComplaintStatus };
