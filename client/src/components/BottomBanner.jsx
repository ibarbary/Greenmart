import bottomBannerBg from "../assets/bottom_banner.png";
import bottomBannerBgSmall from "../assets/bottom_banner_sm.png";
import trustIcon from "../assets/trust_icon.svg";
import leafIcon from "../assets/leaf_icon.svg";
import coinIcon from "../assets/coin_icon.svg";
import deliveryTruck from "../assets/delivery_truck_icon.svg";

function BottomBanner() {
  const featuresOffered = [
    {
      icon: deliveryTruck,
      title: "Fastest Delivery",
      description: "Groceries delivered in under 30 minutes.",
    },
    {
      icon: leafIcon,
      title: "Freshness Guaranteed",
      description: "Fresh produce straight from the source.",
    },
    {
      icon: coinIcon,
      title: "Affordable Prices",
      description: "Quality groceries at unbeatable prices.",
    },
    {
      icon: trustIcon,
      title: "Trusted by Thousands",
      description: "Loved by 10,000+ happy customers.",
    },
  ];

  return (
    <div className="relative mt-24">
      <img
        src={bottomBannerBg}
        alt="banner"
        className="w-full hidden md:block"
      />
      <img
        src={bottomBannerBgSmall}
        alt="banner"
        className="w-full md:hidden"
      />

      <div className="absolute inset-0 flex flex-col items-center md:items-end md:justify-center pt-16 md:pt-0 md:pr-24">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-6">
            Why are we the Best?
          </h1>
          {featuresOffered.map((feature, index) => {
            return (
              <div className="flex items-center gap-4 mt-2" key={index}>
                <img
                  src={feature.icon}
                  alt={feature.title}
                  className="md:w-11 w-9"
                />

                <div>
                  <h3 className="text-lg md:text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default BottomBanner;
