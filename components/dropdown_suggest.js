import React, { useState } from 'react';
import go_ref from "../data/go_terms_reference.json";

const DropdownWithSuggestions = () => {
  // Sample options array (e.g., gene functions or traits)
  const options = Object.keys(go_ref);

  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update suggestions based on input
  const handleInputChange = (e) => {
    const userInput = e.target.value;
    setInputValue(userInput);

    // Filter the options based on user input
    if (userInput.length > 0) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle click on a suggestion
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setShowSuggestions(false); // Hide suggestions after selection
  };

  return (
    <div style={{ width: '300px', margin: '0 auto' }}>
    <link rel="stylesheet" href="filter.css"></link>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter gene function or trait"
        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      
      {/* Render suggestions if available and showSuggestions is true */}
      {showSuggestions && filteredOptions.length > 0 && (
        <ul style={{
          listStyle: 'none',
          padding: '0',
          margin: '0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          maxHeight: '150px',
          overflowY: 'auto',
          position: 'absolute',
        //   background: '#5E19E9',
          width: '300px'
        }}>
          {filteredOptions.map((option, index) => (
            <li 
              key={index} 
              onClick={() => handleSuggestionClick(option)} 
              style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #ccc' }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DropdownWithSuggestions;
