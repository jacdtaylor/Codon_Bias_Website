import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import catData from "../data/cleanedTraitData.json";
import mammaliaData from '../data/proportions/mammalia_data.json';
import Navbar from "../components/navbar";
import { drawChart } from "../components/drawGraph.js";
import DarkSwitch from "../components/DarkSwitch.js";


const Filter = () => {
  const [data, setData] = useState(null); // State to store the fetched data
  const [error, setError] = useState(null); // State to store any error
  const [loading, setLoading] = useState(false); // State to track loading
  const [go_id, set_go_id] = useState(''); // State to track the user input
  const [speciesAndGenes, setSpeciesAndGenes] = useState({});
  const [scientific_name, setScientificName] = useState('');



  
  // Function to fetch the data based on the user input ID

async function getData () {

    if (!go_id) {
        setError('Please enter GO ID');
        return;
      }

    setLoading(true); // Set loading to true when the API call starts
    setError(null); // Clear previous errors

    try {
      let result = await fetchData();
    } catch (error) {
      setError('Could not fetch data.  Try again later.')
    }
  }

  function fetchData () {

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve("Data fetched successfully!");
      }, 2000);
    });
  }
    
    fetch(`https://api.geneontology.org/api/bioentity/function/${go_id}/genes`)
    .then((response) => {
      if (!response.ok) {
        // Attempt to parse the JSON response
        return response.json().then((errorData) => {
          const errorMessage = errorData.message || 'An error occurred';
          throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log(data)
      setData(data); // Set the fetched data in state
      setLoading(false); // Stop loading after data is fetched
    })
    .catch((error) => {
      console.error('Fetch error:', error); // Log the complete error message
      setError(error.message); // Optionally set error state for display
      setLoading(false); // Stop loading in case of an error
    });

      
  };

  const ExtrapolateData = () => {

    setSpeciesAndGenes(data)

    // const newSpeciesAndGenes = {};
    // for (let i = 0; i < data.data.length; i++) {
    //     let GeneList = [];
    //     console.log((data.data[i].organism.name)) 
        
    //     for (let n = 0; n < data.data[i].genes.length; n++) {
    //         GeneList.push(data.data[i].genes[n].gene_id.id);
    //                 }
    //     newSpeciesAndGenes[data.data[i].organism.name] = GeneList;
    //    }
    //    setSpeciesAndGenes(newSpeciesAndGenes);
  }

  return (
    <>
    <link rel="stylesheet" href="filter.css" />
    <Navbar />
    <div>
      <h1>Fetch API Data by GO ID:</h1>

      {/* Input field for user to type the ID */}
      <input 
        type="text" 
        value={go_id} 
        onChange={(e) => set_go_id(e.target.value)} 
        placeholder="Enter GO ID here" 
      />

    {/* Input field for user to type the ID */}
    <input 
        type="text" 
        value={scientific_name} 
        onChange={(e) => setScientificName(e.target.value)} 
        placeholder="Select species to take a closer look" 
      />

      {/* Button to trigger the fetch */}
      <button onClick={()=>getData}>Fetch Data</button>
      <button onClick={ExtrapolateData}>ProcessData</button>

      {/* Display error if it exists */}
      {error && <p>Error: {error}</p>}

      {/* Display loading message */}
      {loading && <p>Loading...</p>}

      {/* Display the JSON data if it exists */}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
    </>
  );
};

export default Filter;