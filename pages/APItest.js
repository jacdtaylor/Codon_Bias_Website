
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import catData from "../data/cleanedTraitData.json";
import mammaliaData from '../data/proportions/mammalia_data.json';
import Navbar from "../components/navbar";
import { drawChart } from "../components/drawGraph.js";

const Filter = () => {
  const [data, setData] = useState(null); // State to store the fetched data
  const [error, setError] = useState(null); // State to store any error
  const [loading, setLoading] = useState(false); // State to track loading
  const [inputId, setInputId] = useState(''); // State to track the user input
  const [speciesAndGenes, setSpeciesAndGenes] = useState({});



  
  // Function to fetch the data based on the user input ID
  const fetchData = () => {
    if (!inputId) {
      setError('Please enter an ID');
      return;
    }

    setLoading(true); // Set loading to true when the API call starts
    setError(null); // Clear previous errors
    fetch(`https://data.orthodb.org/current/orthologs?id=${inputId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setData(data); // Set the fetched data in state
        setLoading(false); // Stop loading after data is fetched
      })
      .catch((error) => {
        setError(error.message); // Handle errors
        setLoading(false); // Stop loading in case of an error
      });

      
  };

  const ExtrapolateData = () => {

    const newSpeciesAndGenes = {};
    if (data.data == null) {setError("No Data Found")
                          return;}
    for (let i = 0; i < data.data.length; i++) {
        let GeneList = [];
        console.log((data.data[i].organism.name)) 
        
        for (let n = 0; n < data.data[i].genes.length; n++) {
            GeneList.push(data.data[i].genes[n].gene_id.id);
                    }
        newSpeciesAndGenes[data.data[i].organism.name] = GeneList;
       }
       setSpeciesAndGenes(newSpeciesAndGenes);
  }

  return (
    <>
    <link rel="stylesheet" href="filter.css" />
    <Navbar />
    <div>
      <h1>Fetch API Data by ID:</h1>

      {/* Input field for user to type the ID */}
      <input 
        type="text" 
        value={inputId} 
        onChange={(e) => setInputId(e.target.value)} 
        placeholder="Enter ID" 
      />

      {/* Button to trigger the fetch */}
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={ExtrapolateData}>Display Data</button>

      {/* Display error if it exists */}
      {error && <p>Error: {error}</p>}

      {/* Display loading message */}
      {loading && <p>Loading...</p>}

      {/* Display the JSON data if it exists */}
      {data && <pre>{JSON.stringify(speciesAndGenes, null, 2)}</pre>}
    </div>
    </>
  );
};

export default Filter;
