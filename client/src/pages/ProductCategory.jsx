import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { context } from "../context/AppContext";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import axios from "../Utils/axiosInstance.js";
import noProducts from "../assets/no-products.png";

function ProductCategory() {
  const { category } = useParams();
  const [currentPage, setCurrentPage] = useState(() => {
    const stored = sessionStorage.getItem("categoryCurrentPage");
    return stored ? parseInt(stored) : 1;
  });

  const {
    products,
    setProducts,
    isLoadingProducts,
    setIsLoadingProducts,
    PRODUCTS_PER_PAGE,
    totalPages,
    setTotalPages,
    totalProducts,
    setTotalProducts,
  } = useContext(context);

  async function fetchProducts() {
    setIsLoadingProducts(true);
    try {
      const offset = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const { data } = await axios.get(
        `/api/products?category=${category}&limit=${PRODUCTS_PER_PAGE}&offset=${offset}`
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      setProducts(data.products);
      setTotalProducts(data.totalCount);
      setTotalPages(Math.ceil(data.totalCount / PRODUCTS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching products: ", error.message);
      if (error.response?.status === 404) {
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
      }
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem("currentCategory") != category)
      setCurrentPage(1);

    sessionStorage.setItem("currentCategory", category);
  }, [category]);

  useEffect(() => {
    fetchProducts();
    sessionStorage.setItem("categoryCurrentPage", currentPage);
    window.scrollTo({ top: 0 });
  }, [currentPage]);

  if (isLoadingProducts) {
    return (
      <div className="mt-32 flex justify-center items-center text-gray-500">
        <p>Loading products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center text-gray-500">
        <img
          src={noProducts}
          alt="No products"
          className="w-32 h-32 opacity-80"
        />
        <p className="text-lg font-medium mt-4">
          Oops! No products available in this category.
        </p>
        <p className="text-sm text-gray-400">
          Check back later or explore other categories!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-16 flex flex-col">
      <div className="flex items-center justify-between pb-4 text-lg font-medium w-full">
        <h1 className="text-2xl font-medium uppercase underline decoration-primary underline-offset-8">
          {category}
        </h1>
        <span className="text-sm text-gray-500">
          {totalProducts} items found
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5 lg:grid-cols-5 mt-6">
        {products
          .filter((product) => product.instock)
          .map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
      </div>

      {totalPages > 1 ? (
        <div className="mt-10 flex justify-center w-full">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      ) : null}
    </div>
  );
}
export default ProductCategory;
