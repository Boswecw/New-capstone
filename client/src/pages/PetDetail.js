import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Card, Button } from 'react-bootstrap';
import { petAPI } from '../services/api';
import SafeImage from '../components/SafeImage';
import HeartRating from '../components/HeartRating';

const PetDetail = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const res = await petAPI.getPetById(id);
        setPet(res.data);
        setLoading(false);
      } catch (err) {
        setError('Unable to fetch pet.');
        setLoading(false);
        console.error('❌ Fetch Pet Error:', err.response?.data || err.message);
      }
    };

    fetchPet();
  }, [id]); // ✅ clean useEffect with no hook warning

  const handleHeartRating = async (value) => {
    try {
      await petAPI.ratePet(pet._id, { rating: value });
      setPet((prev) => ({ ...prev, rating: value }));
    } catch (err) {
      console.error('❌ Rating failed:', err);
    }
  };

  if (loading) {
    return <Spinner animation="border" variant="primary" className="m-5" />;
  }

  if (error) {
    return <div className="text-danger m-5">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <Card className="shadow">
        <div className="row g-0">
          <div className="col-md-5">
            <SafeImage item={pet} category={pet?.type} alt={pet?.name} fitMode="cover" />
          </div>
          <div className="col-md-7 p-4">
            <h2>{pet.name}</h2>
            <p><strong>Type:</strong> {pet.type}</p>
            <p><strong>Breed:</strong> {pet.breed}</p>
            <p><strong>Age:</strong> {pet.age}</p>
            <p>{pet.description}</p>

            <div className="mt-3">
              <strong>Rate This Pet:</strong>
              <HeartRating
                initial={pet?.rating || 0}
                onRate={handleHeartRating}
                max={5}
              />
            </div>

            <Button variant="primary" className="mt-4">Adopt Me</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PetDetail;
