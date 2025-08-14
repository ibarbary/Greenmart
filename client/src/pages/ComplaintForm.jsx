import { useContext, useEffect, useState } from "react";
import { context } from "../context/AppContext";
import axios from "../Utils/axiosInstance.js";
import toast from "react-hot-toast";
import uploadFile from "../assets/upload-file.png";
import { useParams } from "react-router-dom";

function ComplaintForm() {
  const { navigate, user } = useContext(context);
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrderItem();
  }, [id]);

  const fetchOrderItem = async () => {
    try {
      const { data } = await axios.get(
        `/api/orders/item/${id}`,
        
      );

      setProduct(data);
    } catch (error) {
      console.error("Failed to fetch order item:", error);
      toast.error("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("orderItemId", id);
      formData.append("orderId", product.order_id);
      formData.append("userId", user.id);
      formData.append("description", description);
      if (image) {
        formData.append("image", image);
      }

      const { data } = await axios.post(
        "/api/complaints",
        formData,
        {
          
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(
        data.message || "Your complaint has been submitted successfully"
      );
      navigate("/my-orders");
    } catch (error) {
      console.error("Failed to submit complaint:", error);
      toast.error("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Order item not found</p>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="mt-16 pb-10">
        <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
        <p className="text-gray-600 mt-2">
          Let us know what went wrong with your order and we'll help resolve it.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Item Details</h3>
        <div className="flex items-center gap-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 object-contain rounded"
          />
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-600">
              Category: {product.category}
            </p>
            <p className="text-sm text-gray-600">Price: ${product.price}</p>
            <p className="text-sm text-gray-600">Item ID: #{id}</p>
            <p className="text-sm text-gray-600">
              Order ID: #{product.order_id}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Describe the Issue *
          </label>
          <textarea
            id="description"
            required
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-lg outline-none resize-none"
            placeholder="Please describe what went wrong with your order (e.g., item was damaged, expired, wrong product, etc.)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1">
            {description.length}/500 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Photo (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Upload a photo to help us better understand the issue
          </p>

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

                setImage(file);
              }}
              hidden
            />
            <img
              className="w-50  cursor-pointer"
              src={image ? URL.createObjectURL(image) : uploadFile}
              alt="uploadArea"
            />
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/my-orders")}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-darker disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComplaintForm;
