import React, { useState, useRef, useEffect } from 'react';
import Navbar from "../components/navbar";
import go_ref from "../data/go_terms_reference.json";
import { drawChart } from '../components/orthoHeatMap';
import taxo from '../data/taxoTranslator.json';
import Order from "../data/codonOrder.json";
import commonNames from '../data/commonNameTranslator.json'
import * as d3 from 'd3';


const Ontology = () => {

  // for data
  const [data, setData] = useState({}); // State to store the fetched data
  const [scientific_name, setScientificName] = useState(null);
  const [scientific_names, setScientificNames] = useState([]);
  const [trait, set_trait] = useState('');
  const [speciesAndGenes, setSpeciesAndGenes] = useState({});
  const graph = useRef();
  const [codonOrder, setCodonOrder] = useState([]);
  const [taxoTranslator, setTaxoTranslator] = useState({});
  const [reverseTranslator, setReverseTranslator] = useState({})

  // for interface
  const [error, setError] = useState(null); // State to store any error
  const [loading, setLoading] = useState(false); // State to track loading
  const [isVisible, setVisibility] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  // for dropdown
  const options = Object.keys(go_ref);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setCodonOrder(Order);
    setTaxoTranslator(taxo);
    setReverseTranslator(reverseTranslate(taxoTranslator));
}, []);

  function reverseTranslate(taxoTranslator) {
    var reverseRef = {}
    for (const key of Object.keys(taxoTranslator)) {
      reverseRef[taxoTranslator[key]] = key
    }
    return reverseRef
  }

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
      setSpeciesAndGenes({})
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
    console.log(data)
    setScientificNames(Object.keys(species_dict).sort())
    setVisibility(true)
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
  
    // Handle click on a suggestion
    const handleSuggestionClick = (suggestion) => {
      set_trait(suggestion);
      setShowSuggestions(false); // Hide suggestions after selection
    };
    
    // Handle click on a suggestion
    const handleCheckboxChange = (suggestion) => {
      setScientificName(suggestion);
      // setShowSuggestions2(false); // Hide suggestions after selection
      addName(suggestion);
    };

    const addName = (name) => {
      setSpeciesAndGenes((prevSpeciesAndGenes) => {
        // Create a shallow copy of the previous state
        const newDict = { ...prevSpeciesAndGenes };
    
        if (name in newDict) {
          // If the name is already in the object, remove it (deselect)
          delete newDict[name];
        } else {
          // If the name is not in the object, add it
          newDict[name] = data[name];
        }
        
        return newDict; // Return the new object to update state
      });
    };

  const selectAll = () => {
    setSpeciesAndGenes(data)
  }

  const clearAll = () => {
    setSpeciesAndGenes({})
  }

  const pullOrthoData = async (sortedArray) => {
    const fetchPromises = sortedArray.map(async ([species, gene]) => {
        try {
            const response = await fetch(`speciesIndividualJSONS/${species}JSON.json`);
            if (!response.ok) {
                throw new Error("Failed to fetch species data");
            }
            const data = await response.json();
            const proportionData = data[gene][1];

            // Construct AddedData without directly modifying oData in parallel
            const AddedData = codonOrder.reduce((acc, key, index) => {
                acc[key] = proportionData[index];
                return acc;
            }, { Species: species, Gene: gene });

            return AddedData;
            } catch (error) {
                console.error("Error fetching data for", species, gene, error);
                return null; // Return null to filter out unsuccessful fetches
            }
        });

      // Wait for all fetches to complete and filter out any null results
      const results = await Promise.all(fetchPromises);
      const oData = results.filter(Boolean); // Filter out nulls for unsuccessful fetches
      return oData;
    };

  const HandleGraph = async (onLoad) => {
    if (speciesAndGenes.length === 0) {
      alert("No Species Selected");
      return; // Exit early if no species are selected
    }
  
    handleLoading(); // Clear the graph and show the loader
  
    try {
      const array = [];
      for (const key of Object.keys(speciesAndGenes)) {
        for (const gene of speciesAndGenes[key]) {
          array.push([reverseTranslator[key], gene]);
        }
      }
  
      console.log(array);
  
      // Fetch and process data
      const formatted = await pullOrthoData(array);
      setShowLoader(false); // Hide the loader after data is fetched
  
      // Draw the chart with the fetched data
      drawChart(formatted, graph, taxoTranslator);
    } catch (error) {
      console.error("Error fetching or processing data:", error);
      setShowLoader(false); // Hide the loader on error
    }
  };

  const handleLoading = () => {
    d3.select(graph.current).selectAll("*").remove();
    setShowLoader(true);
  };


  return (
        <>
          <link rel="stylesheet" href="filter.css" />
          <Navbar />
          <div className="Left_Column">
            <h1 style={{ width: '100%', padding: '10px', paddingBottom: '20px', fontSize: '20px'}}>
              Search by Gene Function
            </h1>

            <div className='input-container'>
              <input
                type="text"
                value={trait}
                onChange={handleInputChange1}
                placeholder="Enter gene function or trait"
              />

              {showSuggestions && filteredOptions.length > 0 && (
                <ul className='scroll-box'>
                  {filteredOptions.map((option, index) => (
                    <li
                      key={index} // Corrected syntax
                      onClick={() => handleSuggestionClick(option)} // Corrected syntax
                      style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #ccc' }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}

            </div>

          {/* Button to trigger fetch */}
          <div style={{paddingLeft: '60px'}}>
            <button onClick={getData}>
              Fetch Data
            </button>
          </div>

  {isVisible &&
    <div>
    {/* Select Species Section */}
    <h1 style={{ width: '100%', padding: '10px', paddingBottom: '20px', fontSize: '20px', marginTop: '25px'}}>
      Select species
    </h1>

      <div className='GeneNamesUl'>
        {scientific_names.map((name) => (
          <div key={name}>
            <label>
              <input 
                className="GeneNamesLi"
                type="checkbox"
                value={name}
                onChange={() => handleCheckboxChange(name)}
                checked={Object.keys(speciesAndGenes).includes(name)}
              />
              {name}
            </label>
            </div>
        ))}
      </div>
      
    </div>}
    {isVisible && 
    <div className='extra-buttons'>

      <div className='Square_Buttons'
      style={{paddingLeft: '25px'}}>

        <div>
          <button onClick={selectAll}>
            Select All
          </button>
        </div>

        <div>
          <button onClick={clearAll}>
            Clear All
          </button>
        </div>

      </div>

      <div>
        <div style={{paddingLeft: '60px'}}>
          <button onClick={() => {HandleGraph(); }}>
            Graph Data
          </button>
        </div>
      </div>
    </div>}
    </div>

          <div className="Graph">
    
            {/* Display error if it exists */}
            {error && <p>Error: {error}</p>}
    
            {/* Display loading message */}
            {loading && <p>Loading...</p>}
    
            {/* Display the processed species and genes if they exist */}
            {/*speciesAndGenes && <pre className='Graph'>{JSON.stringify(speciesAndGenes, null, 2)}</pre>*/}
            {showLoader &&
                    <div className="loader"></div>}
            <svg ref={graph}></svg>
          </div>
        </>
      );
    }

  
export default Ontology;
