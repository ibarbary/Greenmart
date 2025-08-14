import { useContext, useEffect, useState } from "react";
import { context } from "../context/AppContext";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
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

function EditAddress() {
  const { id } = useParams();
  const {
    addresses,
    setAddresses,
    navigate,
    selectedAddress,
    setSelectedAddress,
    user,
  } = useContext(context);

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

  useEffect(() => {
    const found = addresses.find((a) => a.id === Number(id));
    if (found) setAddress(found);
  }, [addresses, id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setAddress((prevAddress) => {
      return {
        ...prevAddress,
        [name]: value,
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user) {
        await axios.put(`/api/addresses/${id}`, address);
        setAddresses((prevAddresses) => {
          const updatedAddresses = prevAddresses.slice();
          for (let i = 0; i < updatedAddresses.length; ++i) {
            if (updatedAddresses[i].id === Number(id)) {
              updatedAddresses[i] = address;
              break;
            }
          }

          if (selectedAddress?.id === Number(id)) {
            setSelectedAddress(address);
          }

          return updatedAddresses;
        });
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

      setAddress({
        first_name: "",
        last_name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "",
      });

      toast.success("Address updated");
      navigate("/cart");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update address");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-16 flex flex-col">
      <h1 className="text-2xl md:text-3xl text-gray-600 font-semibold">
        Edit Shipping Address
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
            {isSubmitting ? "Updating..." : "Update Address"}
          </button>
        </form>
      </div>
    </div>
  );
}
export default EditAddress;
