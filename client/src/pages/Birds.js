// pages/Birds.js
import React, { useState, useEffect } from "react";
import { petAPI } from "../services/api";
import PetCard from "../components/PetCard";
import LoadingSpinner from "../components/admin/LoadingSpinner";

const Birds = () => {
  const [birds, setBirds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBirds = async () => {
      try {
        const response = await petAPI.getAllPets({ category: "birds" });
        setBirds(response.pets || []);
      } catch (err) {
        setError("Failed to load birds");
      } finally {
        setLoading(false);
      }
    };

    fetchBirds();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Birds for Adoption
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {birds.map((bird) => (
          <PetCard key={bird._id} pet={bird} />
        ))}
      </div>

      {birds.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No birds available for adoption at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default Birds;
