import esClient from "../config/elasticsearch.js";

async function indexProduct(product) {
  await esClient.index({
    index: "products",
    id: product.id,
    body: {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      instock: product.instock,
      price: product.price,
      offerprice: product.offerprice,
      images: product.images,
      category_id: product.category_id,
    },
  });
}

async function searchProducts(searchQuery, categoryId, inStock, limit, offset) {
  const esQuery = {
    index: "products",
    from: offset,
    size: limit,
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: searchQuery,
                fields: ["name", "description", "category"],
                fuzziness: "AUTO",
              },
            },
          ],
          filter: [],
        },
      },
    },
  };

  if (categoryId) {
    esQuery.body.query.bool.filter.push({
      term: { category_id: parseInt(categoryId) },
    });
  }

  if (inStock) {
    esQuery.body.query.bool.filter.push({
      term: { instock: inStock === "true" },
    });
  }

  const result = await esClient.search(esQuery);

  return {
    products: result.body.hits.hits.map((hit) => hit._source),
    totalCount: result.body.hits.total.value,
  };
}

export { indexProduct, searchProducts };
