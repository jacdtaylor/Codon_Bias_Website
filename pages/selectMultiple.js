// import React, { useState, useEffect } from 'react';
import Head from "next/head";
// import Hero from "../components/hero";
// import Navbar from "../components/navbar";

// function Dropdown() {

//   const [options, setSelectableOptions] = useState([]);
//   const [selectedOptions, setSelectedOptions] = useState([]);
//   const [primary, setPrimary] = useState("");

//   const toggleOption = (value) => {
//     if (selectedOptions.includes(value)) {
//       setSelectedOptions(selectedOptions.filter(option => option !== value));
//     } else {
//       setSelectedOptions([...selectedOptions, value]);
//     }
//   };

//   useEffect(() => {
//     setSelectableOptions([]);
//     setSelectableOptions(
//       (primary === "Colors") ? [{value:"red", label:"red"},{value:"blue", label:"blue"},{value:"green", label:"green"}] : 
//       (primary === 'Shapes') ? [{value:"square", label:"square"},{value:"circle", label:"circle"},{value:"triangle", label:"triangle"}] :
//       (primary === "Numbers") ?[{value:"1", label:"1"},{value:"2", label:"2"},{value:"3", label:"3"}] :
//       []
//     );
//   }, [primary]);

//   const HandlePrimaryDropdown = (e) => {
//     setPrimary(e.target.value);
//   };

//   return (
//     <>
//     <Head>
       
//     </Head>
//     <Navbar />
//     <div>
//     <select onChange={HandlePrimaryDropdown} value={primary}>
//         <option value="">Select item</option>
//         <option value="Colors">Colors</option>
//         <option value="Shapes">Shapes</option>
//         <option value="Numbers">Numbers</option>
//     </select>


//       <div className="dropdown">
//         <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
//           Select Options
//         </button>
        
//         <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
//           {options.map(option => (
//             <div key={option.value} className="form-check">
//               <input
//                 className="form-check-input"
//                 type="checkbox"
//                 value={option.value}
//                 id={option.value}
//                 checked={selectedOptions.includes(option.value)}
//                 onChange={() => toggleOption(option.value)}
//               />
//               <label className="form-check-label" htmlFor={option.value}>
//                 {option.label}
//               </label>
//             </div>
//           ))}
//         </div>
//       </div>
//       <p>Selected Options: {selectedOptions.join(', ')}</p>
//     </div>
//     </>
//   );
// }

import React, { useState, useEffect, useRef } from 'react';
import catData from "../data/cleanedTraitData.json";
import Navbar from "../components/navbar";
import { drawChart } from "../components/drawGraph.js";
import * as d3 from 'd3';
import mammaliaData from '../data/proportions/mammalia_data.json';
import DarkSwitch from "../components/DarkSwitch.js"

const Dropdown = () => {
  const svgRef = useRef();
  const checkboxesRef = useRef();
  const [category, setCategory] = useState("");
  const [values, setValues] = useState([]);
  const [categories, setCategories] = useState(Object.keys(catData[0]));
  const [categoricals, setCategoricals] = useState(findCategoricals(catData));
  const [filteredData, setFilteredData] = useState([]);
  const [filter, updateFilter] = useState([])

  useEffect(() => {
    setFilteredData(mammaliaData);
  }, []);

  useEffect(() => {
    handleFilter();
  }, [values]); // Run filter whenever values change

  function findCategoricals(data) {
    let categoricals = [];
    for (let key in data[0]) {
      let val = data[0][key];
      if (val && typeof val === "string") {
        let categories = val.split("|");
        if (categories.length > 1) {
          categoricals.push(key);
        }
      }
    }
    return categoricals;
  }

  const setValuesForCategory = (category) => {
    let valueSet = new Set();
    catData.forEach((item) => {
      let vals = item[category].split("|");
      vals.forEach((val) => valueSet.add(val.trim()));
    });
    return Array.from(valueSet).sort();
  };

  const handleFilterChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    setValues([]);
  };

  const handleCheckboxChange = (e) => {
    const selectedValue = e.target.value;
    if (values.includes(selectedValue)) {
      setValues(values.filter((value) => value !== selectedValue));
    } else {
      setValues([...values, selectedValue]);
    }
  };

  function getSpecies(category, items) {
    const selected = [];
    for (let i = 0; i < items.length; i++) {

      const filtered = catData.filter((ele, index) => ele[category].includes(items[i])).map(ele => ele.scientific_name);
      selected.push(...filtered);
    }
    return selected;
  }
  
  const handleFilter = () => {
    const filteredSpecies = getSpecies(category, values)
    updateFilter(filteredSpecies);
    // Use filteredSpecies directly instead of filter state
    const filtered = filteredData.filter(item => filteredSpecies.includes(item.Name));
  
    if (filtered.length > 0) {
      drawChart(filtered, svgRef, filteredSpecies);
    } else {
      console.warn('No data found for the selected IDs');
      // Clear existing svg content if no data found
      d3.select(svgRef.current).selectAll("*").remove();
    }
  };
  

  return (
    <>
      <link rel="stylesheet" href="filter.css" />
      <Navbar />
      <div>
        <select
          className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md"
          onChange={handleFilterChange}
          value={category}
        >
          <option disabled value="">
            -- select filter --
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {category && (
          <div ref={checkboxesRef} className="checkbox-container">
            {setValuesForCategory(category).map((val) => (
              <div key={val}>
                <input
                  type="checkbox"
                  id={val}
                  value={val}
                  checked={values.includes(val)}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor={val}>{val}</label>
              </div>
            ))}
          </div>
        )}
        <div className="graph-container">
          <svg ref={svgRef}></svg>
        </div>
        <div id="info-box"></div>
      </div>
    </>
  );
};

export default Dropdown;
