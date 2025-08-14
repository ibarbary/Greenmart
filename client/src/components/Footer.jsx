import Broccoli from "../assets/broccoli.png";
import { Link } from "react-router-dom";

const Footer = () => {
  const linkSections = [
    {
      title: "Quick Links",
      links: ["Home", "Best Sellers", "Offers & Deals", "Contact Us", "FAQs"],
    },
    {
      title: "Need Help?",
      links: [
        "Delivery Information",
        "Return & Refund Policy",
        "Payment Methods",
        "Track your Order",
        "Contact Us",
      ],
    },
    {
      title: "Follow Us",
      links: ["Instagram", "Twitter", "Facebook", "YouTube"],
    },
  ];

  return (
    <div className="bg-primary/10 px-6 md:px-16 lg:px-24 xl:px-32 mt-24">
      <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30">
        <div>
          <Link
            to={"/"}
            className="flex items-center gap-1"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img className="h-9" src={Broccoli} alt="logo" />
            <h1 className="text-3xl font-bold">Greenmart</h1>
          </Link>
          <p className="max-w-[410px] mt-6 text-gray-500">
            We deliver fresh groceries and snacks straight to your door. Trusted
            by thousands, we aim to make your shopping experience simple and
            affordable.
          </p>
        </div>
        <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
          {linkSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-base text-gray-900 md:mb-5 mb-2">
                {section.title}
              </h3>
              <ul className="text-sm space-y-1 text-gray-500">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <a href="#" className="hover:underline transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="py-4 text-center text-sm md:text-base">
        Greenmart {new Date().getFullYear()} © All Rights Reserved.
      </p>
    </div>
  );
};

export default Footer;
