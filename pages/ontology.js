import React, { useState, useEffect } from 'react';
import Navbar from "../components/navbar";
import go_ref from "../data/go_terms_reference.json";
import DropdownWithSuggestions from '../components/dropdown_suggest';


const Filter = () => {
  const [data, setData] = useState(null); // State to store the fetched data
  const [scientific_names, setScientificNames] = useState([]);
  const [error, setError] = useState(null); // State to store any error
  const [loading, setLoading] = useState(false); // State to track loading
  const [trait, set_trait] = useState('');
  const [speciesAndGenes, setSpeciesAndGenes] = useState({});
  const [scientific_name, setScientificName] = useState('');

  // for dropdown
  const options = Object.keys(go_ref);

  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredOptions2, setFilteredOptions2] = useState([]);
  const [showSuggestions2, setShowSuggestions2] = useState(false);

  // Function to fetch the data based on the user input ID
  async function getData() {
    if (!trait) {
      setError('Please enter gene function');
      return;
    }

    setLoading(true); // Set loading to true when the API call starts
    setError(null);   // Clear previous errors

    try {
      const result = await fetchData();
      formatData(result); // Set the fetched data in state
    } catch (error) {
      setError('Could not fetch data. Try again later.');
    } finally {
      setLoading(false); // Always stop loading after the call, success or failure
    }
  }

  async function fetchData() {
    const url = `https://api.geneontology.org/api/bioentity/function/${go_ref[trait]}/genes`;
    
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json(); // Parse the error response
        const errorMessage = errorData.message || 'An error occurred';
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      const data = await response.json(); // Parse the JSON response
      return data; // Return the data to be used in getData()

    } catch (error) {
      console.error('Fetch error:', error);
      throw error; // Re-throw the error to be caught in getData()
    }
  }

  const formatData = (fetchedData) => {
    const species_dict = {}; // Create a new object to hold the species and genes
    if (!fetchedData || !fetchedData['associations']) {
      console.log('No associations found in data');
      return; // Exit if there's no data
    }

    for (let i = 0; i < fetchedData['associations'].length; i++) {
      const species = fetchedData['associations'][i]['subject']['taxon']['label'];
      const gene = fetchedData['associations'][i]['subject']['label'];
      console.log(species, gene);
      
      if (species in species_dict) {
        if (!species_dict[species].includes(gene)) {
          species_dict[species].push(gene);
        }
      } else {
        species_dict[species] = [gene];
      }
    }
    setData(species_dict); // Set the processed data
    setScientificNames(Object.keys(species_dict))
  };

    // Update suggestions based on input
    const handleInputChange1 = (e) => {
      set_trait(e.target.value)
  
      // Filter the options based on user input
      if (trait.length > 0) {
        const filtered = options.filter((option) =>
          option.toLowerCase().includes(trait.toLowerCase())
        );
        setFilteredOptions(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    };

    const handleInputChange2 = (e) => {
      setScientificName(e.target.value)
  
      // Filter the options based on user input
      if (scientific_name.length > 0) {
        const filtered = scientific_names.filter((option) =>
          option.toLowerCase().includes(scientific_name.toLowerCase())
        );
        setFilteredOptions2(filtered);
        setShowSuggestions2(true);
      } else {
        setShowSuggestions2(false);
      }
    };
  
    // Handle click on a suggestion
    const handleSuggestionClick = (suggestion) => {
      set_trait(suggestion);
      setShowSuggestions(false); // Hide suggestions after selection
    };
    
    // Handle click on a suggestion
    const handleSuggestionClick2 = (suggestion) => {
      setScientificName(suggestion);
      setShowSuggestions2(false); // Hide suggestions after selection
    };

    if (data != null) {
      return (
        <>
          <link rel="stylesheet" href="filter.css" />
          <Navbar />
          <div>
          <h1 style={{ width: '100%', padding: '30px', fontSize: '20px'}}>
              Search by Gene Function
              </h1>
    
            <div style={{ width: '300px'}}>
        <link rel="stylesheet" href="filter.css"></link>
          <input
            type="text"
            value={trait}
            onChange={handleInputChange1}
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

    
            {/* Button to trigger the fetch */}
            <div style={{ width: '150px'}}>
            <button onClick={getData} 
                  style={{ width: '100%', 
                  padding: '8px',
                  marginLeft: '50px', 
                  marginTop: '175px',
                  borderRadius: '4px', 
                  border: '1px solid #ccc' }}>
              Fetch Data
              </button>
              </div>
    
            {/* Display error if it exists */}
            {error && <p>Error: {error}</p>}
    
            {/* Display loading message */}
            {loading && <p>Loading...</p>}
    
            {data && (
              <div style={{ position: 'absolute', left: '50%', top: '50px', width: '300px', margin: '10px', padding: '10px'}}>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
  )}
          </div>
          <div> 
          <h1 style={{ width: '100%', padding: '30px', fontSize: '20px', marginTop: '25px'}}>
              Select Species to take a closer look
              </h1>
              <input style={{ width: '300px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              type="text"
              value={scientific_name}
              onChange={handleInputChange2}
              placeholder="Select species to take a closer look"
          />
          </div>
          <div>
            {/* Render suggestions if available and showSuggestions is true */}
            {showSuggestions2 && filteredOptions2.length > 0 && (
            <ul style={{
              listStyle: 'none',
              padding: '0',
              margin: '0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxHeight: '150px',
              overflowY: 'auto',
              position: 'absolute',
              width: '300px'
            }}>
              {filteredOptions2.map((option, index) => (
                <li 
                  key={index} 
                  onClick={() => handleSuggestionClick2(option)} 
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #ccc' }}
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
        </>
      );
    }

    else {
      return (
        <>
          <link rel="stylesheet" href="filter.css" />
          <Navbar />
          <div>
            <h1 style={{ width: '100%', padding: '30px', fontSize: '20px'}}>
              Search by Gene Function
              </h1>
    
            <div style={{ width: '300px'}}>
        <link rel="stylesheet" href="filter.css"></link>
          <input
            type="text"
            value={trait}
            onChange={handleInputChange1}
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
    
            {/* Button to trigger the fetch */}
            <div style={{ width: '150px'}}>
            <button onClick={getData} 
                  style={{ width: '100%', 
                  padding: '8px', 
                  marginLeft: '50px',
                  marginTop: '175px',
                  borderRadius: '4px', 
                  border: '1px solid #ccc' }}>
              Fetch Data
              </button>
              </div>
    
            {/* Display error if it exists */}
            {error && <p>Error: {error}</p>}
    
            {/* Display loading message */}
            {loading && <p>Loading...</p>}
    
            {/* Display the processed species and genes if they exist */}
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
          </div>
        </>
      );
    }
    
    }

  
export default Filter;
