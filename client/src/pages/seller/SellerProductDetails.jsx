import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import emptyBox from "../../assets/emptyBox.png";
import { context } from "../../context/AppContext";

const SellerProductDetails = () => {
  const { id } = useParams();
  const { products, navigate } = useContext(context);
  const [thumbnail, setThumbnail] = useState(null);

  const product = products.find((product) => product.id === Number(id));

  useEffect(() => {
    if (product?.images?.length > 0) {
      setThumbnail(product.images[0]);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="mt-24 flex flex-col items-center justify-center text-gray-500">
        <img src={emptyBox} alt="No product" className="w-32 h-32 opacity-80" />
        <p className="text-lg font-medium mt-4">
          Oops! Product does not exist!
        </p>
      </div>
    );
  }

  return (
    product && (
      <div className="mt-12 px-6 max-w-6xl w-full">
        <div className="flex flex-col md:flex-row gap-16 mt-4">
          <div className="flex gap-3">
            <div className="flex flex-col gap-3">
              {product.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setThumbnail(image)}
                  className="border max-w-24 border-gray-500/30 rounded overflow-hidden cursor-pointer"
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>

            <div className="flex items-center border border-gray-500/30 max-w-100 rounded overflow-hidden">
              <img src={thumbnail} alt="Selected product" />
            </div>
          </div>

          <div className="text-sm w-full md:w-1/2">
            <h1 className="text-3xl font-medium">{product.name}</h1>

            <div className="mt-6">
              {product.offerprice ? (
                <>
                  <p className="text-gray-500/70 line-through">
                    ${parseFloat(product.price)}
                  </p>
                  <p className="text-3xl font-medium">
                    ${parseFloat(product.offerprice)}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-medium">
                  ${parseFloat(product.price)}
                </p>
              )}
            </div>

            {product.description?.length > 0 && (
              <>
                <p className="text-base font-medium mt-6">About Product</p>
                <ul className="list-disc ml-4 text-gray-500/70">
                  {product.description.map((desc, index) => (
                    <li key={index}>{desc}</li>
                  ))}
                </ul>
              </>
            )}

            <button
              onClick={() => navigate(`/seller/edit-product/${id}`)}
              className="mt-10 w-full py-3.5 bg-primary text-white font-medium hover:bg-primary-darker transition"
            >
              Edit Product
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default SellerProductDetails;
