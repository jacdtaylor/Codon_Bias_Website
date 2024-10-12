import React, { useState, useEffect } from 'react';
import Navbar from "../components/navbar";
import go_ref from "../data/go_terms_reference.json";


const Filter = () => {
  const [data, setData] = useState(null); // State to store the fetched data
  const [error, setError] = useState(null); // State to store any error
  const [loading, setLoading] = useState(false); // State to track loading
  const [go_id, set_go_id] = useState(''); // State to track the user input
  const [trait, set_trait] = useState('');
  const [speciesAndGenes, setSpeciesAndGenes] = useState({});
  const [scientific_name, setScientificName] = useState('');

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
    console.log(go_ref)
    console.log(go_ref[trait])
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
  };

  return (
    <>
      <link rel="stylesheet" href="filter.css" />
      <Navbar />
      <div>
        <h1>Fetch API Data by GO ID:</h1>

        {/* Input field for user to type the GO ID */}
        <input
          type="text"
          value={trait}
          onChange={(e) => set_trait(e.target.value)}
          placeholder="Enter gene function here"
        />

        {/* Input field for user to filter by scientific name */}
        <input
          type="text"
          value={scientific_name}
          onChange={(e) => setScientificName(e.target.value)}
          placeholder="Select species to take a closer look"
        />

        {/* Button to trigger the fetch */}
        <button onClick={getData}>Fetch Data</button>

        {/* Display error if it exists */}
        {error && <p>Error: {error}</p>}

        {/* Display loading message */}
        {loading && <p>Loading...</p>}

        {/* Display the processed species and genes if they exist */}
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </div>
    </>
  );
};

export default Filter;
