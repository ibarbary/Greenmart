import { useContext, useState } from "react";
import { context } from "../context/AppContext";
import toast from "react-hot-toast";
import axios from "../Utils/axiosInstance.js";

function InputField({ type, placeholder, name, address, handleChange }) {
  return (
    <input
      className="border border-gray-500/30 p-2 rounded text-gray-500 focus:border-primary outline-none transition"
      type={type}
      placeholder={placeholder}
      onChange={handleChange}
      name={name}
      value={address[name]}
      required
    ></input>
  );
}

function AddAddress() {
  const { setAddresses, setSelectedAddress, navigate, user } =
    useContext(context);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setAddress((prevAddress) => {
      return {
        ...prevAddress,
        [name]: value,
      };
    });
  }

  async function addAddress() {
    setIsSubmitting(true);
    try {
      if (user) {
        const { data } = await axios.post("/api/addresses", address);

        setAddresses((prev) => [...prev, { ...address, id: data.id }]);
      } else {
        setAddresses(() => {
          const guestAddresses = [{ ...address, id: Date.now() }];
          localStorage.setItem(
            "guestAddresses",
            JSON.stringify(guestAddresses)
          );
          return guestAddresses;
        });
        setSelectedAddress(address);
      }

      toast.dismiss();
      toast.success("Address added");

      setAddress({
        first_name: "",
        last_name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "",
      });

      navigate("/cart");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Failed to add address");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    addAddress();
  }

  return (
    <div className="mt-16 flex flex-col">
      <h1 className="text-2xl md:text-3xl text-gray-600 font-semibold">
        Add Shipping Address
      </h1>

      <div className="mt-16">
        <form
          onSubmit={handleSubmit}
          method="post"
          className=" flex flex-col gap-2 w-full max-w-lg"
        >
          <InputField
            type="text"
            placeholder="First Name"
            name="first_name"
            address={address}
            handleChange={handleChange}
          />
          <InputField
            type="text"
            placeholder="Last Name"
            name="last_name"
            address={address}
            handleChange={handleChange}
          />

          <InputField
            type="text"
            placeholder="Phone Number"
            name="phone"
            address={address}
            handleChange={handleChange}
          />
          <InputField
            type="text"
            placeholder="Street"
            name="street"
            address={address}
            handleChange={handleChange}
          />
          <InputField
            type="text"
            placeholder="City"
            name="city"
            address={address}
            handleChange={handleChange}
          />
          <InputField
            type="text"
            placeholder="State"
            name="state"
            address={address}
            handleChange={handleChange}
          />
          <InputField
            type="text"
            placeholder="Country"
            name="country"
            address={address}
            handleChange={handleChange}
          />

          <button
            type="submit"
            className="mt-5 px-4 py-2 bg-primary text-white rounded hover:bg-primary-darker transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Address"}
          </button>
        </form>
      </div>
    </div>
  );
}
export default AddAddress;
