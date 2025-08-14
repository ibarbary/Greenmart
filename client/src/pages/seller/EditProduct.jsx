import { useContext, useState } from "react";
import { context } from "../../context/AppContext";
import offerTag from "../../assets/tag.png";
import uploadFile from "../../assets/upload-file.png";
import toast from "react-hot-toast";
import axios from "../../Utils/axiosInstance.js";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const EditProduct = () => {
  const { id } = useParams();
  const { categories } = useContext(context);

  const [addOffer, setAddOffer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState({
    name: "",
    category: "",
    description: [],
    price: "",
    offerprice: "",
    instock: false,
    images: [],
    category_id: null,
  });

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      const { data } = await axios.get(
        `/api/products/${id}`
      );
      const product = data.product;

      setProduct({
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        offerprice: product.offerprice,
        instock: product.instock,
        images: product.images,
        category_id: product.category_id,
      });

      setAddOffer(product.offerprice ? true : false);
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Failed to load product");
    }
  }

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    const newImages = [...product.images];
    newImages[index] = file;

    setProduct((prev) => ({ ...prev, images: newImages }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    toast.dismiss();
    setIsSubmitting(true);

    const { name, category, description, price, images, category_id } = product;

    if (
      !name ||
      !category ||
      !category_id ||
      !price ||
      description.length < 3
    ) {
      toast.error("Please fill out all required fields.");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    try {
      const hasNewImages = images.some((img) => typeof img === "object");

      if (hasNewImages) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("category", category);
        formData.append("category_id", category_id);
        formData.append("price", price);
        formData.append("instock", product.instock);

        if (product.offerprice) {
          formData.append("offerprice", product.offerprice);
        }

        description.forEach((desc) => {
          formData.append("description", desc);
        });

        const imageMetadata = [];
        images.forEach((img, index) => {
          if (typeof img === "string") {
            imageMetadata.push({ type: "existing", url: img, position: index });
          } else if (img && typeof img === "object") {
            formData.append("newImages", img);
            imageMetadata.push({ type: "new", position: index });
          }
        });

        formData.append("imageMetadata", JSON.stringify(imageMetadata));

        await axios.put(`/api/products/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const updateData = {
          name,
          category,
          description,
          price,
          offerprice: product.offerprice ? product.offerprice : null,
          category_id,
          instock: product.instock,
          images,
        };

        await axios.put(`/api/products/${id}`, updateData);
      }

      toast.success("Product updated");
      loadProduct();
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.error || "Failed to add product.";
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
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {Array(4)
              .fill("")
              .map((_, index) => (
                <label key={index} htmlFor={`image${index}`}>
                  <input
                    accept="image/*"
                    type="file"
                    id={`image${index}`}
                    name={`image${index}`}
                    onChange={(e) => handleImageUpload(e, index)}
                    hidden
                  />
                  <img
                    className="w-24 cursor-pointer"
                    src={
                      product.images[index]
                        ? typeof product.images[index] === "string"
                          ? product.images[index]
                          : URL.createObjectURL(product.images[index])
                        : uploadFile
                    }
                    alt="uploadArea"
                  />
                </label>
              ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            onChange={(e) => {
              setProduct((prevProduct) => {
                return { ...prevProduct, name: e.target.value };
              });
            }}
            value={product.name}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            required
          />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label
            className="text-base font-medium"
            htmlFor="product-description"
          >
            Product Description
          </label>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              required
              value={product.description[i] || ""}
              onChange={(e) => {
                const newDescriptions = [...product.description];
                newDescriptions[i] = e.target.value;
                setProduct((prev) => ({
                  ...prev,
                  description: newDescriptions,
                }));
              }}
            />
          ))}
        </div>
        <div className="w-full flex flex-col gap-1">
          <label className="text-base font-medium" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => {
              const { id, name } = categories.find(
                (cat) => cat.name === e.target.value
              );
              setProduct((prev) => ({
                ...prev,
                category: name,
                category_id: id,
              }));
            }}
            value={product.category}
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex-1 flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Product Price
            </label>
            <input
              id="product-price"
              type="text"
              onChange={(e) => {
                setProduct((prevProduct) => {
                  return { ...prevProduct, price: Number(e.target.value) };
                });
              }}
              value={product.price}
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              required
            />
          </div>
          {addOffer ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 flex flex-col gap-1 w-32">
                <label className="text-base font-medium" htmlFor="offer-price">
                  Offer Price
                </label>
                <input
                  id="offer-price"
                  type="text"
                  onChange={(e) => {
                    setProduct((prevProduct) => ({
                      ...prevProduct,
                      offerprice:
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                    }));
                  }}
                  value={product.offerprice}
                  className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddOffer(false);
                  setProduct((prevProduct) => ({
                    ...prevProduct,
                    offerprice: "",
                  }));
                }}
                className="flex items-center gap-2 text-sm px-3 py-3 self-end rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
              >
                Remove Offer
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddOffer(true)}
              className="flex items-center gap-2 text-sm px-3 py-3 self-end rounded border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <img src={offerTag} alt="Add Offer" className="w-5 h-5" />
              Add Offer
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            id="in-stock"
            type="checkbox"
            checked={product.instock}
            onChange={(e) => {
              setProduct((prev) => ({
                ...prev,
                instock: e.target.checked,
              }));
            }}
            className="w-4 h-4"
          />
          <label htmlFor="in-stock" className="text-base font-medium">
            In Stock
          </label>
        </div>
        <button
          className="px-8 py-2.5 bg-primary hover:bg-primary-darker text-white font-medium rounded disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
};
export default EditProduct;
