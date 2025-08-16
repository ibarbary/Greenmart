import { useState } from "react";
import uploadFile from "../../assets/upload-file.png";
import toast from "react-hot-toast";
import axios from "../../Utils/axiosInstance.js";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

function EditCategory() {
  const { id } = useParams();

  const [category, setCategory] = useState({
    name: "",
    image: "",
    image_public_id: "",
    is_active: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategory();
  }, [id]);

  async function loadCategory() {
    try {
      const { data } = await axios.get(
        `/api/categories/${id}`
      );

      const category = data.category;

      setCategory({
        name: category.name,
        image: category.image,
        image_public_id: category.image_public_id,
        is_active: category.is_active,
      });
    } catch (error) {
      console.error("Error loading category:", error);
      toast.error("Failed to load category");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    toast.dismiss();
    setIsSubmitting(true);

    const { name, image, is_active, image_public_id } = category;

    if (!name || !image) {
      toast.error("Provide name and image for the category");
      return;
    }

    try {
      if (typeof category.image === "object") {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("image", image);
        formData.append("image_public_id", image_public_id);
        formData.append("is_active", is_active);
        await axios.put(
          `/api/categories/${id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        await axios.put(`/api/categories/${id}`, category);
      }

      toast.success("Category updated");
      loadCategory();
    } catch (error) {
      console.log(error);
      const message =
        error.response?.data?.error || "Failed to update category";
      toast.dismiss();
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col justify-between bg-white">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium mb-3">Category Image</p>
          <label htmlFor={`image`}>
            <input
              accept="image/*"
              type="file"
              id={`image`}
              name={`image`}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  toast.error("Image size should be less than 5MB");
                  return;
                }

                setCategory((prevCat) => {
                  return { ...prevCat, image: file };
                });
              }}
              hidden
            />
            <img
              className="w-40  cursor-pointer"
              src={
                category.image
                  ? typeof category.image === "string"
                    ? category.image
                    : URL.createObjectURL(category.image)
                  : uploadFile
              }
              alt="uploadArea"
            />
          </label>
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="category-name">
            Category Name
          </label>
          <input
            id="category-name"
            type="text"
            onChange={(e) => {
              setCategory((prevCat) => {
                return { ...prevCat, name: e.target.value };
              });
            }}
            value={category.name}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="is_active"
            type="checkbox"
            checked={category.is_active}
            onChange={(e) => {
              setCategory((prevCat) => {
                return { ...prevCat, is_active: e.target.checked };
              });
            }}
            className="w-4 h-4"
          />
          <label htmlFor="is_active" className="text-base font-medium">
            Active
          </label>
        </div>
        <button
          className="px-8 py-2.5 bg-primary hover:bg-primary-darker text-white font-medium rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
}
export default EditCategory;
