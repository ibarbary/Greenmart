import { faker } from "@faker-js/faker";
import pg from "pg";
import dotenv from "dotenv";
import esClient from "./config/elasticsearch.js";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  
  idleTimeoutMillis: 10000, 
  connectionTimeoutMillis: 1000
});

const BATCH_SIZE = 10000;
const TOTAL_PRODUCTS = 50000;

// async function createProductsIndexWithEdgeNGrams() {
//   try {
//     // Delete existing index if it exists
//     await esClient.indices.delete({ index: "products" }).catch(() => {});

//     // Create new index with edge n-gram analyzer (better for prefix matching)
//     await esClient.indices.create({
//       index: "products",
//       body: {
//         settings: {
//           analysis: {
//             analyzer: {
//               edge_ngram_analyzer: {
//                 type: "custom",
//                 tokenizer: "standard",
//                 filter: ["lowercase", "edge_ngram_filter"],
//               },
//               search_analyzer: {
//                 type: "custom",
//                 tokenizer: "standard",
//                 filter: ["lowercase"],
//               },
//             },
//             filter: {
//               edge_ngram_filter: {
//                 type: "edge_ngram",
//                 min_gram: 3, // Start from 2 characters
//                 max_gram: 20, // Up to 20 characters (covers most product names)
//               },
//             },
//           },
//         },
//         mappings: {
//           properties: {
//             id: { type: "integer" },
//             name: {
//               type: "text",
//               analyzer: "edge_ngram_analyzer",
//               search_analyzer: "search_analyzer",
//               fields: {
//                 keyword: { type: "keyword" },
//               },
//             },
//             description: {
//               type: "text",
//               analyzer: "edge_ngram_analyzer",
//               search_analyzer: "search_analyzer",
//             },
//             category: {
//               type: "text",
//               analyzer: "edge_ngram_analyzer",
//               search_analyzer: "search_analyzer",
//               fields: {
//                 keyword: { type: "keyword" },
//               },
//             },
//             instock: { type: "boolean" },
//             price: { type: "float" },
//             offerprice: { type: "float" },
//             images: { type: "text", index: false },
//             category_id: { type: "integer" },
//           },
//         },
//       },
//     });

//     console.log("Products index created with edge n-gram analyzer");
//   } catch (error) {
//     console.error("Error creating index:", error);
//     throw error;
//   }
// }


// createProductsIndexWithEdgeNGrams();

async function indexAllProducts() {
  try {
    // 1. Fetch from DB
    const { rows: products } = await pool.query(`
  SELECT id, name, description, category, instock, price, offerprice, images, category_id
  FROM "Greenmart".products
`);


    // 2. Prepare bulk payload
    const bulkOps = products.flatMap((product) => [
      { index: { _index: "products", _id: product.id } },
      {
        id: product.id,
        name: product.name,
        description: product.description, // ensure array
        category: product.category,
        instock: product.instock,
        price: product.price,
        offerprice: product.offerprice,
        images: product.images,
        category_id: product.category_id,
      },
    ]);

  
    const result = await esClient.bulk({ refresh: true, body: bulkOps });

 
    if (result.errors) {
      console.error("Some documents failed to index:", result.items);
    } else {
      console.log(`Indexed ${products.length} products successfully!`);
    }
  } catch (err) {
    console.error("Error indexing products:", err);
  }
}

indexAllProducts();

// async function bulkIndexToElasticsearch(products) {
//   try {
//     const bulkOps = products.flatMap((product) => [
//       { index: { _index: "products", _id: product.id } },
//       {
//         id: product.id,
//         name: product.name,
//         description: product.description,
//         category: product.category,
//         instock: product.instock,
//         price: parseFloat(product.price),
//         offerprice: product.offerprice ? parseFloat(product.offerprice) : null,
//         images: product.images,
//         category_id: product.category_id,
//       },
//     ]);

//     const result = await esClient.bulk({
//       refresh: false, // Don't refresh immediately for better performance
//       body: bulkOps,
//     });

//     if (result.errors) {
//       console.error(
//         "⚠️ Some documents failed to index:",
//         result.items.filter((item) => item.index.error)
//       );
//     }

//     return !result.errors;
//   } catch (error) {
//     console.error("❌ Error bulk indexing to Elasticsearch:", error);
//     return false;
//   }
// }

// const generateProduct = () => {
//   return {
//     name: faker.commerce.productName(),
//     description: [faker.commerce.productDescription()],
//     category: faker.commerce.department(),
//     instock: faker.datatype.boolean(),
//     price: faker.commerce.price(5, 200, 2),
//     offerprice: faker.datatype.boolean()
//       ? faker.commerce.price(1, 150, 2)
//       : null,
//     images: [faker.image.url()],
//     category_id: null, // or use random IDs if you have actual categories
//   };
// };

// async function seedProductsWithElasticsearch() {
//   console.log(
//     `🚀 Starting to insert ${TOTAL_PRODUCTS} products in batches of ${BATCH_SIZE}...`
//   );

//   let totalInserted = 0;
//   let totalIndexed = 0;

//   for (let i = 0; i < TOTAL_PRODUCTS / BATCH_SIZE; i++) {
//     const batchStart = Date.now();

//     // Generate batch of products
//     const products = [];
//     const values = [];

//     for (let j = 0; j < BATCH_SIZE; j++) {
//       const p = generateProduct();
//       products.push(p);

//       values.push(`(
//         '${p.name.replace(/'/g, "''")}',
//         ARRAY['${p.description.map((d) => d.replace(/'/g, "''")).join("','")}'],
//         '${p.category.replace(/'/g, "''")}',
//         ${p.instock},
//         ${p.price},
//         ${p.offerprice ?? "NULL"},
//         ARRAY['${p.images.join("','")}'],
//         ${p.category_id}
//       )`);
//     }

//     // Insert into PostgreSQL
//     const query = `
//       INSERT INTO "Greenmart".products
//         (name, description, category, inStock, price, offerPrice, images, category_id)
//       VALUES ${values.join(",")}
//       RETURNING id
//     `;

//     try {
//       // Insert to DB and get IDs
//       const result = await pool.query(query);
//       const insertedIds = result.rows.map((row) => row.id);
//       totalInserted += insertedIds.length;

//       // Add IDs to products for Elasticsearch
//       products.forEach((product, index) => {
//         product.id = insertedIds[index];
//       });

//       // Bulk index to Elasticsearch
//       const esSuccess = await bulkIndexToElasticsearch(products);
//       if (esSuccess) {
//         totalIndexed += products.length;
//       }

//       const batchTime = Date.now() - batchStart;
//       console.log(
//         `✅ Batch ${i + 1}/${Math.ceil(
//           TOTAL_PRODUCTS / BATCH_SIZE
//         )} completed in ${batchTime}ms` +
//           ` | DB: ${totalInserted} | ES: ${totalIndexed}`
//       );

//       // Small delay to prevent overwhelming the systems
//       if (i % 10 === 0 && i > 0) {
//         console.log("⏸️ Brief pause to prevent system overload...");
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }
//     } catch (err) {
//       console.error(`❌ Error in batch ${i + 1}:`, err);
//       break;
//     }
//   }

//   // Final refresh of Elasticsearch index
//   try {
//     await esClient.indices.refresh({ index: "products" });
//     console.log("🔄 Elasticsearch index refreshed");
//   } catch (error) {
//     console.error("⚠️ Error refreshing Elasticsearch index:", error);
//   }

//   console.log(`🎉 COMPLETED!`);
//   console.log(`📊 Final Stats:`);
//   console.log(`   - PostgreSQL: ${totalInserted} products inserted`);
//   console.log(`   - Elasticsearch: ${totalIndexed} products indexed`);

//   await pool.end();
//   console.log("🔒 Database connection closed");
// }

// Run the seeding
// seedProductsWithElasticsearch().catch(console.error);