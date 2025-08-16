import { useContext, useEffect, useRef, useState } from "react";
import ProductCard from "../components/ProductCard";
import { context } from "../context/AppContext";
import Pagination from "../components/Pagination";
import emptyBox from "../assets/emptyBox.png";
import axios from "../Utils/axiosInstance.js";
import { useSearchParams } from "react-router-dom";

function Products() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const previousQuery = useRef(query);

  const [currentPage, setCurrentPage] = useState(() => {
    const stored = sessionStorage.getItem("productsCurrentPage");
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
        `/api/products?query=${query}&limit=${PRODUCTS_PER_PAGE}&offset=${offset}`
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      setProducts(data.products);
      setTotalProducts(data.totalCount);
      setTotalPages(Math.ceil(data.totalCount / PRODUCTS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching products: ", error.message);
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    const currentCategory = sessionStorage.getItem("currentCategory");
    if (
      previousQuery.current !== query ||
      (currentCategory && currentCategory !== "all")
    ) {
      setCurrentPage(1);
      previousQuery.current = query;
    }
  }, [query]);

  useEffect(() => {
    fetchProducts();
    sessionStorage.setItem("productsCurrentPage", currentPage);
    sessionStorage.setItem("currentCategory", "all");
    window.scrollTo({ top: 0 });
  }, [currentPage, query]);

  if (isLoadingProducts) {
    return (
      <div className="mt-32 flex justify-center items-center text-gray-500">
        <p>Loading products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="mt-24 flex flex-col items-center justify-center text-gray-500">
        <img
          src={emptyBox}
          alt="No products"
          className="w-32 h-32 opacity-80"
        />
        <p className="text-lg font-medium mt-4">
          No products available at the moment. Please check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-16 flex flex-col">
      <div className="flex items-center justify-between pb-4 text-lg font-medium w-full">
        <h2 className="text-2xl font-medium uppercase underline decoration-primary underline-offset-8">
          ALL PRODUCTS
        </h2>
        <span className="text-sm text-gray-500">
          {totalProducts} items found
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5 lg:grid-cols-5 mt-6">
        {products
          ?.filter((product) => product.instock)
          .map((product, index) => {
            return <ProductCard key={product.id} product={product} />;
          })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-10 flex justify-between items-center w-full">
          <div></div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      ) : null}
    </div>
  );
}
export default Products;
