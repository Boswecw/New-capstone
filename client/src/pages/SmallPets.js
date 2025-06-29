// pages/SmallPets.js
import React, { useState, useEffect } from "react";
import { petAPI } from "../services/api";
import PetCard from "../components/PetCard";
import LoadingSpinner from "../components/admin/LoadingSpinner";

const SmallPets = () => {
  const [smallPets, setSmallPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSmallPets = async () => {
      try {
        const response = await petAPI.getAllPets({ category: "small-pets" });
        setSmallPets(response.pets || []);
      } catch (err) {
        setError("Failed to load small pets");
      } finally {
        setLoading(false);
      }
    };

    fetchSmallPets();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Small Pets for Adoption
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {smallPets.map((pet) => (
          <PetCard key={pet._id} pet={pet} />
        ))}
      </div>

      {smallPets.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No small pets available for adoption at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default SmallPets;
