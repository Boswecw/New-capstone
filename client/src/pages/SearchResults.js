// pages/SearchResults.js
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { petAPI } from "../services/api";
import PetCard from "../components/PetCard";
import LoadingSpinner from "../components/admin/LoadingSpinner";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    const fetchResults = async () => {
      if (!query && !category) {
        setLoading(false);
        return;
      }

      try {
        const params = {};
        if (query) params.search = query;
        if (category) params.category = category;

        const response = await petAPI.getAllPets(params);
        // API returns { success: true, data: [...] }
        setResults(response.data?.data || []);
      } catch (err) {
        setError("Failed to fetch search results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, category]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Search Results
        </h1>
        {query && (
          <p className="text-gray-600">
            Showing results for:{" "}
            <span className="font-semibold">"{query}"</span>
          </p>
        )}
        {category && (
          <p className="text-gray-600">
            Category: <span className="font-semibold">{category}</span>
          </p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {results.length} {results.length === 1 ? "result" : "results"} found
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((pet) => (
          <PetCard key={pet._id} pet={pet} />
        ))}
      </div>

      {results.length === 0 && !loading && (query || category) && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or browse our available pets.
            </p>
            <a
              href="/browse"
              className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse All Pets
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
