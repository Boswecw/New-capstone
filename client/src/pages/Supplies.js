// pages/Supplies.js
import React, { useState, useEffect } from "react";
import LoadingSpinner from "../components/admin/LoadingSpinner";

const Supplies = () => {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Supplies" },
    { id: "food", name: "Food & Treats" },
    { id: "toys", name: "Toys" },
    { id: "bedding", name: "Bedding & Comfort" },
    { id: "health", name: "Health & Care" },
    { id: "training", name: "Training" },
    { id: "accessories", name: "Accessories" },
  ];

  useEffect(() => {
    // Simulate loading supplies data
    setTimeout(() => {
      setSupplies([
        {
          id: 1,
          name: "Premium Dog Food",
          category: "food",
          price: 29.99,
          image: "/placeholder-food.jpg",
        },
        {
          id: 2,
          name: "Cat Toy Set",
          category: "toys",
          price: 15.99,
          image: "/placeholder-toy.jpg",
        },
        {
          id: 3,
          name: "Pet Bed",
          category: "bedding",
          price: 45.99,
          image: "/placeholder-bed.jpg",
        },
        // Add more supplies...
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredSupplies =
    selectedCategory === "all"
      ? supplies
      : supplies.filter((supply) => supply.category === selectedCategory);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Pet Supplies</h1>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Supplies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredSupplies.map((supply) => (
          <div
            key={supply.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              src={supply.image}
              alt={supply.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/300x200?text=Pet+Supply";
              }}
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {supply.name}
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                ${supply.price}
              </p>
              <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSupplies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No supplies found in this category.
          </p>
        </div>
      )}
    </div>
  );
};

export default Supplies;
