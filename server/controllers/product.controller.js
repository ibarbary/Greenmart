import pool from "../db/connection.js";
import queryList from "../db/queries.js";
import { v2 as cloudinary } from "cloudinary";
import { indexProduct, searchProducts } from "../services/search.services.js";
import esClient from "../config/elasticsearch.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getProducts(req, res) {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const searchQuery = req.query.query || "";
  const categoryId = parseInt(req.query.categoryId);
  const inStock = req.query.inStock;

  try {
    if (searchQuery.trim()) {
      const { products, totalCount } = await searchProducts(
        searchQuery,
        categoryId,
        inStock,
        limit,
        offset
      );

      return res.status(200).json({ products, totalCount });
    }

    let whereConditions = [];
    let queryValues = [];
    let valueIndex = 1;

    if (searchQuery?.trim()) {
      whereConditions.push(
        `(name ILIKE $${valueIndex} OR EXISTS (
    SELECT 1 FROM unnest(description) d WHERE d ILIKE $${valueIndex}
  ))`
      );
      queryValues.push(`%${searchQuery.trim()}%`);
      valueIndex++;
    }

    if (categoryId) {
      whereConditions.push(`category_id = $${valueIndex}`);
      queryValues.push(categoryId);
      valueIndex++;
    }

    if (inStock) {
      const stockValue = inStock === "true";
      whereConditions.push(`instock = $${valueIndex}`);
      queryValues.push(stockValue);
      valueIndex++;
    }

    const where =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    queryValues.push(limit);
    queryValues.push(offset);

    const productQuery = `SELECT * FROM products ${where} ORDER BY id LIMIT $${valueIndex} OFFSET $${
      valueIndex + 1
    }`;
    const countQuery = `SELECT COUNT(*) as total FROM products ${where}`;

    const [productsResult, countResult] = await Promise.all([
      pool.query(productQuery, queryValues),
      pool.query(countQuery, queryValues.slice(0, -2)),
    ]);

    const products = productsResult.rows;
    const totalCount = countResult.rows[0].total;

    return res.status(200).json({ products, totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to get products" });
  }
}

async function getProduct(req, res) {
  const { id } = req.params;

  if (isNaN(id)) return res.status(400).json({ error: "Invalid Product Id!" });

  try {
    const queryText = queryList.GET_PRODUCT;
    const result = await pool.query(queryText, [id]);
    const product = result.rows[0];

    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get product" });
  }
}

async function addProduct(req, res) {
  const {
    name,
    category,
    description,
    price,
    offerprice,
    instock,
    category_id,
  } = req.body;

  const images = req.files;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM products`
    );
    const totalProducts = parseInt(countResult.rows[0].total);

    if (totalProducts >= 30000) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error:
          "Sorry, we can’t add more products right now because our Bonsai storage limit is close to being reached ):",
      });
    }

    const imageUrls = [];

    if (images && images.length > 0) {
      for (const image of images) {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "products",
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" },
              ],
              timeout: 60000,
            },
            (error, result) => {
              if (error) {
                console.log("Cloudinary upload error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          uploadStream.end(image.buffer);
        });

        imageUrls.push(uploadResult.secure_url);
      }
    }

    const queryText = queryList.ADD_PRODUCT;
    const insertResult = await client.query(queryText, [
      name,
      description,
      category,
      instock === "true",
      parseFloat(price),
      offerprice ? parseFloat(offerprice) : null,
      imageUrls,
      parseInt(category_id),
    ]);

    try {
      const productId = insertResult.rows[0].id;

      await indexProduct({
        id: productId,
        name,
        description,
        category,
        instock: instock === "true",
        price: parseFloat(price),
        offerprice: offerprice ? parseFloat(offerprice) : null,
        images: imageUrls,
        category_id: parseInt(category_id),
      });
      console.log(`Product ${productId} indexed successfully in Elasticsearch`);
    } catch (error) {
      console.log(error);
      await client.query("ROLLBACK");
      return res.status(500).json({
        error:
          "Sorry, we can’t add more products right now because our Bonsai storage limit has been reached ):",
      });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Product created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to create product" });
  } finally {
    client.release();
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    price,
    offerprice,
    category_id,
    instock,
    images,
    imageMetadata,
  } = req.body;

  const newImageFiles = req.files;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let finalImages = [];

    if (imageMetadata) {
      const metadata = JSON.parse(imageMetadata);

      const uploadedUrls = [];
      for (const file of newImageFiles) {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "products",
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
        uploadedUrls.push(uploadResult.secure_url);
      }

      let index = 0;
      const sortedMetadata = metadata.sort((a, b) => a.position - b.position);

      for (const item of sortedMetadata) {
        if (item.type === "existing") {
          finalImages.push(item.url);
        } else if (item.type === "new") {
          finalImages.push(uploadedUrls[index]);
          index++;
        }
      }
    } else {
      finalImages = images;
    }

    const queryText = queryList.UPDATE_PRODUCT;
    await client.query(queryText, [
      name,
      description,
      category,
      instock === "true" || instock === true,
      parseFloat(price),
      offerprice ? parseFloat(offerprice) : null,
      finalImages,
      parseInt(category_id),
      id,
    ]);

    try {
      await indexProduct({
        id: parseInt(id),
        name,
        description,
        category,
        instock: instock === "true" || instock === true,
        price: parseFloat(price),
        offerprice: offerprice ? parseFloat(offerprice) : null,
        images: finalImages,
        category_id: parseInt(category_id),
      });
    } catch (error) {
      console.log(error);
      await client.query("ROLLBACK");
      return res.status(500).json({
        error: "Failed to update product in ElasticSearch",
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update product" });
  } finally {
    client.release();
  }
}

async function updateProductStock(req, res) {
  const { id } = req.params;
  const { instock } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Product ID" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const queryText = queryList.UPDATE_PRODUCT_STOCK;
    await client.query(queryText, [instock, id]);

    try {
      await esClient.update({
        index: "products",
        id: id,
        body: {
          doc: { instock: instock },
        },
      });
    } catch (error) {
      console.log(error);
      await client.query("ROLLBACK");
      return res.status(500).json({
        error: "Failed to update product status in ElasticSearch",
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({ message: "Stock Updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update stock" });
  } finally {
    client.release();
  }
}

export {
  getProduct,
  addProduct,
  getProducts,
  updateProduct,
  updateProductStock,
};
