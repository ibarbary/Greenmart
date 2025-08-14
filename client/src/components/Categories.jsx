import { useContext } from "react";
import { context } from "../context/AppContext";
function Categories() {
  const { navigate, categories } = useContext(context);

  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl">Categories</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mt-6 gap-6">
        {categories
          .filter((category) => category.is_active)
          .map((category, index) => {
            const { name, image } = category;
            return (
              <div
                key={index}
                onClick={() => {
                  navigate(`products/${name}`);
                }}
                className="group cursor-pointer bg-categoryCard py-2 px-3 gap-2 rounded-lg flex flex-col justify-center items-center"
              >
                <div className="h-30 flex items-center justify-center">
                  <img
                    src={image}
                    alt={name}
                    className="h-full object-contain"
                  />
                </div>
                <p className="text-center">
                  {name
                    .split(" ")
                    .map((s) => {
                      return s[0].toUpperCase() + s.slice(1);
                    })
                    .join(" ")}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
export default Categories;
