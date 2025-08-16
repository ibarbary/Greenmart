import { useContext, useState } from "react";
import cartIcon from "../assets/cart_icon.svg";
import { context } from "../context/AppContext";

const ProductCard = ({ product }) => {
  const { cart, addToCart, removeFromCart, navigate } = useContext(context);

  return (
    <div className="border border-gray-500/20 rounded-md md:px-4 px-3 py-2 bg-white w-full flex flex-col">
      <div
        onClick={() => {
          navigate(`/products/${product.category}/${product.id}`);
        }}
        className="h-40 md:h-45 flex items-center justify-center overflow-hidden cursor-pointer"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="max-w-30 lg:max-w-38 h-full object-contain"
        />
      </div>

      <div className="text-gray-500/60 text-sm mt-2 flex flex-col flex-grow">
        <p>{product.category}</p>
        <p className="text-gray-700 font-medium text-lg w-full overflow-hidden line-clamp-4">
          {product.name}
        </p>
        <div className="flex-grow" />
        <div className="flex items-end justify-between mt-3">
          <p className="md:text-xl text-base font-medium text-primary">
            {product.offerprice ? (
              <>
                ${parseFloat(product.offerprice)}{" "}
                <span className="text-gray-500/60 md:text-sm text-xs line-through">
                  ${parseFloat(product.price)}
                </span>
              </>
            ) : (
              <>${parseFloat(product.price)}</>
            )}
          </p>
          <div className="text-primary">
            {!cart[product.id] ? (
              <button
                className="flex items-center cursor-pointer justify-center gap-1 bg-primary/10 border border-primary/40 px-2 md:w-20 w-16 h-8.5 rounded"
                onClick={() => addToCart(product)}
              >
                <img src={cartIcon} alt="cart" />
                Add
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 md:w-20 w-16 h-[34px] bg-primary/25 rounded select-none">
                <button
                  onClick={() => removeFromCart(product.id)}
                  className="cursor-pointer text-md px-2 h-full"
                >
                  -
                </button>
                <span className="w-5 text-center">
                  {cart[product.id].quantity}
                </span>
                <button
                  onClick={() => addToCart(product)}
                  className="cursor-pointer text-md px-2 h-full"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
