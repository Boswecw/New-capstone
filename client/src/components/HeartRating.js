// client/src/components/HeartRating.js
import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import './HeartRating.css';

const HeartRating = ({ initial = 0, onRate, max = 5, size = 20 }) => {
  const [rating, setRating] = useState(initial);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    setRating(initial); // keep in sync with external changes
  }, [initial]);

  const handleClick = (index) => {
    const newRating = index + 1;
    setRating(newRating);
    onRate?.(newRating);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(index);
    }
  };

  return (
    <div className="heart-rating d-flex" role="radiogroup" aria-label="Heart rating">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < (hovered ?? rating);
        const Icon = filled ? FaHeart : FaRegHeart;

        return (
          <span
            key={i}
            role="radio"
            aria-checked={i + 1 === rating}
            tabIndex={0}
            onClick={() => handleClick(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: 'pointer',
              fontSize: size,
              color: filled ? 'crimson' : '#ccc',
              marginRight: '4px'
            }}
          >
            <Icon />
          </span>
        );
      })}
    </div>
  );
};

export default HeartRating;
