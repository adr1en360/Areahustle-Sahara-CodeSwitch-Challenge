"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function Register() {
  const router = useRouter();
  const [role, setRole] = useState<"hustler" | "customer">("hustler");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    phoneNumber: "",
    nin: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("demoUser", JSON.stringify({ ...formData, role }));
    router.push("/");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Join AreaHustle</h2>

      <div className="flex justify-center mb-6 space-x-4">
        <button className={`px-4 py-2 rounded ${role === "hustler" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setRole("hustler")}>
          I am a Hustler
        </button>
        <button className={`px-4 py-2 rounded ${role === "customer" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setRole("customer")}>
          I am a Customer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input type="text" name="fullName" placeholder="Full Name" required className="border p-2 rounded" onChange={handleInputChange} />

        <input type="email" name="email" placeholder="Email" required className="border p-2 rounded" onChange={handleInputChange} />

        <input type="password" name="password" placeholder="Password" required className="border p-2 rounded" onChange={handleInputChange} />

        <div className="flex space-x-4">
          <input type="number" name="age" placeholder="Age" required className="border p-2 rounded w-1/3" onChange={handleInputChange} />

          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            required
            className="border p-2 rounded w-2/3"
            onChange={handleInputChange}
          />
        </div>

        <input type="text" name="nin" placeholder="NIN Verification Number" required className="border p-2 rounded" onChange={handleInputChange} />

        <button type="submit" className="bg-green-600 text-white font-bold py-3 rounded mt-4">
          Register as {role === "hustler" ? "Hustler" : "Customer"}
        </button>
      </form>
    </div>
  );
}
