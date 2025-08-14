import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../Utils/axiosInstance.js";
import { context } from "../context/AppContext";
import ProductCard from "../components/ProductCard";
import emptyBox from "../assets/emptyBox.png";

const ProductDetails = () => {
  const { id, category } = useParams();
  const { products, navigate, addToCart } = useContext(context);

  const [thumbnail, setThumbnail] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const productsOfCategory = products.filter(
    (product) => category === product.category
  );

  useEffect(() => {
    const foundProduct = productsOfCategory.find(
      (product) => product.id === Number(id)
    );

    if (foundProduct) {
      setProduct(foundProduct);
      setThumbnail(foundProduct.images?.[0] || null);
      setLoading(false);
    } else {
      (async () => {
        try {
          const { data } = await axios.get(
            `/api/products/${id}`
          );
          setProduct(data.product);
          setThumbnail(data.product?.images?.[0] || null);
        } catch (err) {
          console.error("Error fetching product:", err);
          setProduct(null);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  });

  if (loading) {
    return (
      <div className="mt-24 flex items-center justify-center">
        <p>Loading product...</p>
      </div>
    );
  }

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
      <div className="mt-12">
        <div className="max-w-6xl w-full px-6">
          <p>
            <Link to={"/"}>Home</Link>
            {" / "}
            <Link to={"/products"}>Products</Link>
            {" / "}
            <Link to={`/products/${category}`}>
              {product.category
                .split(" ")
                .map((s) => {
                  return s[0].toUpperCase() + s.slice(1);
                })
                .join(" ")}
            </Link>
            {" / "}
            <span className="text-primary"> {product.name}</span>
          </p>

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

              {product.description ? (
                <>
                  <p className="text-base font-medium mt-6">About Product</p>
                  <ul className="list-disc ml-4 text-gray-500/70">
                    {product.description.map((desc, index) => (
                      <li key={index}>{desc}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              <div className="flex items-center mt-10 gap-4 text-base">
                <button
                  onClick={() => {
                    addToCart(product);
                  }}
                  className="w-full py-3.5 cursor-pointer font-medium bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => {
                    addToCart(product);
                    navigate("/cart");
                  }}
                  className="w-full py-3.5 cursor-pointer font-medium bg-primary text-white hover:bg-primary-darker transition"
                >
                  Buy now
                </button>
              </div>
            </div>
          </div>
        </div>

        {productsOfCategory.length > 1 ? (
          <div className="flex flex-col items-center mt-20">
            <div className="flex flex-col items-center w-max">
              <p className="text-3xl font-medium">Related Products</p>
              <div className="w-20 h-0.5 bg-primary rounded-full mt-2"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6 w-full">
              {productsOfCategory
                .filter((p) => p.instock)
                .filter((p) => p.id !== product.id)
                .slice(0, 5)
                .map((p, index) => {
                  return <ProductCard key={index} product={p} />;
                })}
            </div>
          </div>
        ) : null}
      </div>
    )
  );
};

export default ProductDetails;
