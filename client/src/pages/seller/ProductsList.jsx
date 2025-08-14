import { useContext } from "react";
import { context } from "../../context/AppContext";
import edit from "../../assets/edit.png";
import searchIcon from "../../assets/search-icon.png";
import eye from "../../assets/see.png";
import { useState } from "react";
import axios from "../../Utils/axiosInstance.js";
import { useEffect } from "react";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import { useRef } from "react";

const ProductsList = () => {
  const {
    products,
    setProducts,
    isLoadingProducts,
    setIsLoadingProducts,
    totalPages,
    setTotalPages,
    currentPage,
    setCurrentPage,
    PRODUCTS_PER_PAGE,
    categories,
    navigate,
    totalProducts,
    setTotalProducts,
  } = useContext(context);

  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [inStock, setInStock] = useState("");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [inStock, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, inStock, selectedCategory]);

  async function fetchProducts() {
    setIsLoadingProducts(true);
    try {
      const query = new URLSearchParams({
        limit: PRODUCTS_PER_PAGE,
        offset: (currentPage - 1) * PRODUCTS_PER_PAGE,
        categoryId: categories.find((c) => c.name === selectedCategory)?.id,
        inStock,
        query: searchInput.trim(),
      }).toString();
      
      const { data } = await axios.get(
        `/api/products?${query}`
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      setProducts(data.products);
      setTotalProducts(data.totalCount);
      setTotalPages(Math.ceil(data.totalCount / PRODUCTS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching products: ", error.message);
    } finally {
      setIsLoadingProducts(false);
    }
  }

  async function updateProductStock(id, instock) {
    try {
      const { data } = await axios.patch(
        `/api/products/${id}/stock`,
        {
          instock,
        }
      );

      const message = data.message || "Product's stock updated";
      toast.dismiss();
      toast.success(message);
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.error || "Failed to update stock";
      toast.error(message);
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="mt-4 md:pl-10 pl-4">
        <div className="relative max-w-md w-full flex items-center">
          <input
            type="text"
            placeholder="Search products"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchProducts();
                setCurrentPage(1);
              }
            }}
            className="w-full px-5 py-2 text-sm rounded-lg border border-gray-300 placeholder-gray-500 focus:ring-0 focus:outline-none"
          />
          <button
            type="button"
            onClick={fetchProducts}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
          >
            <img src={searchIcon} alt="search" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 md:pl-10 pl-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={inStock}
          onChange={(e) => setInStock(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
        >
          <option value="">All Stock Status</option>
          <option value="true">In Stock</option>
          <option value="false">Out of Stock</option>
        </select>
      </div>

      <div className="flex-1 flex flex-col justify-between w-full">
        <div className="w-full md:p-10 p-4">
          <div className="flex items-center justify-between pb-4 text-lg font-medium max-w-5xl w-full">
            <h2>All Products</h2>
            <span className="text-sm text-gray-500">
              {totalProducts} items found
            </span>
          </div>

          <div className="flex flex-col items-center max-w-5xl w-full  rounded-md bg-white border border-gray-500/20">
            <table className="md:table-auto table-fixed w-full">
              <thead className="text-gray-900 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold truncate">Product</th>
                  <th className="px-4 py-3 font-semibold truncate">Category</th>
                  <th className="px-4 py-3 font-semibold truncate hidden md:block">
                    Selling Price
                  </th>
                  <th className="px-4 py-3 font-semibold truncate">In Stock</th>
                  <th className="px-4 py-3 font-semibold truncate">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {isLoadingProducts
                  ? [...Array(5)].map((_, i) => (
                      <tr
                        key={i}
                        className="border-t border-gray-300 animate-pulse"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-gray-300 rounded" />
                            <div className="w-32 h-4 bg-gray-300 rounded" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-20 h-4 bg-gray-300 rounded" />
                        </td>
                        <td className="px-4 py-3 max-sm:hidden">
                          <div className="w-16 h-4 bg-gray-300 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-12 h-6 bg-gray-300 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-4 h-4 bg-gray-300 rounded" />
                        </td>
                      </tr>
                    ))
                  : products.map((product, index) => (
                      <tr key={index} className="border-t border-gray-500/20">
                        <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                          <div className="border border-gray-300 rounded p-2">
                            <img
                              src={product.images[0]}
                              alt="Product"
                              className="w-18 h-18 object-contain"
                            />
                          </div>
                          <div className="flex flex-col truncate max-sm:hidden">
                            <span>{product.name}</span>
                            <span className="text-gray-700">
                              ID: {product.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{product.category}</td>
                        <td className="px-4 py-3 max-sm:hidden">
                          $
                          {product.offerprice
                            ? parseFloat(product.offerprice)
                            : parseFloat(product.price)}
                        </td>
                        <td className="px-4 py-3">
                          <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              defaultChecked={product.instock}
                              onChange={(e) => {
                                const instock = e.target.checked;
                                updateProductStock(product.id, instock);
                              }}
                            />
                            <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-primary transition-colors duration-200"></div>
                            <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <div className="relative group">
                              <img
                                className="w-6 h-6 cursor-pointer"
                                src={eye}
                                alt="viewProduct"
                                onClick={() => {
                                  navigate(`/seller/products/${product.id}`);
                                }}
                              />
                              <span className="absolute right-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex px-2 py-1 text-xs text-white bg-black rounded shadow-md z-10">
                                View Product
                              </span>
                            </div>

                            <div className="relative group">
                              <img
                                className="w-5 h-5 cursor-pointer"
                                src={edit}
                                alt="edit"
                                onClick={() => {
                                  navigate(
                                    `/seller/edit-product/${product.id}`
                                  );
                                }}
                              />
                              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex px-2 py-1 text-xs text-white bg-black rounded shadow-md z-10">
                                Edit Product
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="mb-10 md:px-10 px-4">
          <div className="flex justify-between">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default ProductsList;
