import { useContext, useState } from "react";
import { context } from "../../context/AppContext";
import edit from "../../assets/edit.png";
import axios from "../../Utils/axiosInstance.js";
import toast from "react-hot-toast";

function CategoriesList() {
  const { categories, navigate } = useContext(context);

  async function updateCategoryActiveStatus(id, is_active) {
    try {
      const { data } = await axios.patch(
        `/api/categories/${id}/status`,
        {
          is_active,
        }
      );

      const message = data.message || "Category active status updated";
      toast.dismiss();
      toast.success(message);
    } catch (error) {
      console.log(error);
      const message =
        error.response?.data?.error || "Failed to update active status";
      toast.error(message);
    }
  }
  return (
    <div className="flex flex-col w-full">
      <div className="flex-1 flex flex-col justify-between w-full">
        <div className="w-full md:p-10 p-4">
          <div className="flex items-center justify-between pb-4 text-lg font-medium max-w-5xl w-full">
            <h2>Categories</h2>
            <span className="text-sm text-gray-500">
              {categories.length} Categories
            </span>
          </div>

          <div className="flex flex-col items-center max-w-5xl w-full  rounded-md bg-white border border-gray-500/20">
            <table className="md:table-auto table-fixed w-full">
              <thead className="text-gray-900 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold truncate">Category</th>
                  <th className="px-4 py-3 font-semibold truncate">Active</th>
                  <th className="px-4 py-3 font-semibold truncate">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {categories.map((category, index) => (
                  <tr key={index} className="border-t border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                      <div className="border border-gray-300 rounded p-2">
                        <img
                          src={category.image}
                          alt="Product"
                          className="w-18 h-18 object-contain"
                        />
                      </div>
                      <div className="flex flex-col truncate max-sm:hidden uppercase">
                        <span>{category.name}</span>
                        <span className="text-gray-700">ID: {category.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={category.is_active}
                          onChange={(e) => {
                            const is_active = e.target.checked;
                            updateCategoryActiveStatus(category.id, is_active);
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
                            className="w-5 h-5 cursor-pointer"
                            src={edit}
                            alt="edit"
                            onClick={() => {
                              navigate(`/seller/edit-category/${category.id}`);
                            }}
                          />
                          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex px-2 py-1 text-xs text-white bg-black rounded shadow-md z-10">
                            Edit Category
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
    </div>
  );
}
export default CategoriesList;
