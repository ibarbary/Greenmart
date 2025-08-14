import pool from "../db/connection.js";
import queryList from "../db/queries.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getAllCategories(req, res) {
  try {
    const queryText = queryList.GET_ALL_CATEGORIES;
    const result = await pool.query(queryText);
    const categories = result.rows;

    return res.status(200).send({ categories });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to get categories" });
  }
}

async function getCategory(req, res) {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Category ID" });
  }

  try {
    const result = await pool.query(queryList.GET_CATEGORY, [id]);
    const category = result.rows[0];
    return res.status(200).json({ category });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to get category" });
  }
}

async function addCategory(req, res) {
  const { name, is_active } = req.body;
  const image = req.file;

  try {
    let imageUrl = "";
    let image_public_id = "";
    if (image) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "categories",
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
      image_public_id = uploadResult.public_id;
    }

    await pool.query(queryList.ADD_CATEGORY, [
      name.toLowerCase(),
      imageUrl,
      image_public_id,
      is_active,
    ]);

    return res.status(201).json({ message: "Category added" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to add category" });
  }
}

async function updateCategoryActiveStatus(req, res) {
  const { id } = req.params;
  const { is_active } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Category ID" });
  }

  try {
    await pool.query(queryList.UPDATE_CATEGORY_ACTIVE_STATUS, [is_active, id]);

    return res.status(200).json({ message: "Active Status Updated" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Failed to update category's active status" });
  }
}

async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, image, image_public_id, is_active } = req.body;
  const newImage = req.file;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Category Id" });
  }

  try {
    let finalImage = "";
    let newPublicId = "";
    if (newImage) {
      await cloudinary.uploader.destroy(image_public_id);

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "categories",
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

      finalImage = uploadResult.secure_url;
      newPublicId = uploadResult.public_id;
    } else {
      finalImage = image;
      newPublicId = image_public_id;
    }

    await pool.query(queryList.UPDATE_CATEGORY, [
      name,
      finalImage,
      newPublicId,
      is_active === "true" || is_active === true,
      id,
    ]);

    return res.status(200).json({ message: "Category updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update category" });
  }
}

export {
  getAllCategories,
  getCategory,
  addCategory,
  updateCategoryActiveStatus,
  updateCategory,
};
