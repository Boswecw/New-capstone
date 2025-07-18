// client/src/components/HeartRating.js
import React, { useState } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import './HeartRating.css'; // optional styling

const HeartRating = ({ initial = 0, onRate, max = 5, size = 20 }) => {
  const [rating, setRating] = useState(initial);
  const [hovered, setHovered] = useState(null);

  const handleClick = (index) => {
    setRating(index + 1);
    onRate?.(index + 1);
  };

  return (
    <div className="heart-rating d-flex">
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < (hovered ?? rating);
        const Icon = isFilled ? FaHeart : FaRegHeart;
        return (
          <span
            key={i}
            onClick={() => handleClick(i)}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', fontSize: size }}
          >
            <Icon color={isFilled ? 'crimson' : '#ccc'} />
          </span>
        );
      })}
    </div>
  );
};

export default HeartRating;
