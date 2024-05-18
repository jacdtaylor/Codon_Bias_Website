import React, { useState, useEffect, useRef } from 'react';
import catData from "../data/cleanedTraitData.json";
import Navbar from "../components/navbar";
import { drawChart } from "../components/drawGraph.js";
import * as d3 from 'd3';
import mammaliaData from '../data/proportions/mammalia_data.json';
import DarkSwitch from "../components/DarkSwitch.js";

const Dropdown = () => {
  const svgRef = useRef();
  const checkboxesRef = useRef();
  const [category, setCategory] = useState("");
  const [values, setValues] = useState([]);
  const [categories, setCategories] = useState(Object.keys(catData[0]));
  const [categoricals, setCategoricals] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filter, updateFilter] = useState([]);
  const [speciesNames, updateNames] = useState([]);

  useEffect(() => {
    setFilteredData(mammaliaData);
    updateNames(mammaliaData.map(item => item.Name));
    setCategoricals(findCategoricals(catData));
  }, []);

  useEffect(() => {
    handleFilter();
  }, [values]);

  function containsNumber(str) {
    return /\d/.test(str);
  }

  function findCategoricals(data) {
    let categoricals = [];
    for (let key in data[0]) {
      let val = data[0][key];
      if (!containsNumber(val)) {
        categoricals.push(key);
      }
    }
    return categoricals;
  }

  const isInMammaliaData = (item) => {
    return speciesNames.includes(item);
  };

  const setValuesForCategory = (category) => {
    let valueSet = new Set();
    catData.forEach((item) => {
      let vals = item[category].split("|");
      vals.forEach((val) => valueSet.add(val.trim()));
    });

    let valuesArray = Array.from(valueSet).sort();
    valuesArray = valuesArray.filter((val) => getSpecies(category, [val]).length > 3);
    return valuesArray;
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
      const filtered = catData.filter((ele) => ele[category].includes(items[i])).map(ele => ele.scientific_name);
      selected.push(...filtered);
    }
    return selected.filter(item => isInMammaliaData(item));
  }

  const handleFilter = () => {
    const filteredSpecies = getSpecies(category, values);
    updateFilter(filteredSpecies);

    const filtered = filteredData.filter(item => filteredSpecies.includes(item.Name));

    if (filtered.length > 0) {
      drawChart(filtered, svgRef, filteredSpecies);
    } else {
      console.warn('No data found for the selected IDs');
      d3.select(svgRef.current).selectAll("*").remove();
    }
  };

  return (
    <>
      <link rel="stylesheet" href="filter.css" />
      <Navbar />
      <div>
        <div className="Left_Column">
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
          {categoricals.includes(category) && (
            <div ref={checkboxesRef} className="GeneNamesUl">
              {setValuesForCategory(category)
                .map((val) => (
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
                ))
              }
            </div>
          )}
          {!categoricals.includes(category) && (<div class="range_container">
    <div class="sliders_control">
        <input id="fromSlider" type="range" value="10" min="0" max="100"/>
        <input id="toSlider" type="range" value="40" min="0" max="100"/>
    </div>
    <div class="form_control">
        <div class="form_control_container">
            <div class="form_control_container__time">Min</div>
            <input class="form_control_container__time__input" type="number" id="fromInput" value="10" min="0" max="100"/>
        </div>
        <div class="form_control_container">
            <div class="form_control_container__time">Max</div>
            <input class="form_control_container__time__input" type="number" id="toInput" value="40" min="0" max="100"/>
        </div>
    </div>
</div>)}
        </div>
        <div className="Graph">
          <svg ref={svgRef}></svg>
        </div>
        <div id="info-box"></div>
      </div>
    </>
  );
};

export default Dropdown;
