// components/DebugComponent.js
import React, { useState } from 'react';

const DebugComponent = () => {
  const [count, setCount] = useState(0);
  
  console.log('DebugComponent rendered, count:', count);
  
  return (
    <div>
      <h2>Debug Component</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default DebugComponent;