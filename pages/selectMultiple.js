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
  const [key, updateKey] = useState({});

  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);
  const [upperLimit, setUpper] = useState(100);
  const [lowerLimit, setLower] = useState(0);

  const [tempMinValue, setTempMinValue] = useState(0);
  const [tempMaxValue, setTempMaxValue] = useState(100);
  const [Unit, setUnit] = useState("NA");

  useEffect(() => {
    setFilteredData(mammaliaData);
    updateNames(mammaliaData.map(item => item.Name));
    setCategoricals(findCategoricals(catData));
  }, []);

  useEffect(() => {
    handleFilter();
  }, [values]);

  useEffect(() => {
    handleMinMax();
  }, [category]);

  function containsNumber(str) {
    return /\d/.test(str);
  }

  const handleSliderChange = (e) => {
    const { id, value } = e.target;
    if (id === 'fromSlider') {
      setTempMinValue(Number(value).toFixed(3));
    } else {
      setTempMaxValue(Number(value).toFixed(3));
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    if (id === 'minInput') {
      if (!isNaN(parseFloat(value))) {
        setTempMinValue(value);
      } else {
        setTempMinValue(0);
      }
    } else {
      if (!isNaN(parseFloat(value))) {
        setTempMaxValue(value);
      } else {
        setTempMaxValue(0);
      }
    }
  };

  const applyFilter = () => {
    asyncApplyFilter();
  };

  const asyncApplyFilter = async () => {
    await setMinValue(parseFloat(tempMinValue));
    await setMaxValue(parseFloat(tempMaxValue));
    await numericalFilter();
  };

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
      if (item[category]) {
        let vals = item[category].split("|");
        vals.forEach((val) => valueSet.add(val.trim()));
      }
    }
    );
    
    let valuesArray = Array.from(valueSet).sort();
    if (category !== "scientific_name") {
      valuesArray = valuesArray.filter((val) => getSpecies(category, [val]).length > 3);
    } else {
      valuesArray = valuesArray.filter((val) => getSpecies(category, [val]).length >= 1);
    }

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

  function combineArraysIntoObject(array1, array2) {
    if (array1.length !== array2.length) {
      throw new Error("Arrays must have the same length.");
    }

    var combinedObject = {};

    for (var i = 0; i < array1.length; i++) {
      if (!combinedObject[array1[i]]) {
        combinedObject[array1[i]] = [];
      }

      combinedObject[array1[i]].push(array2[i]);
    }

    return combinedObject;
  }

  function getFilteredSpecies(category, items) {
    const selected = [];
    const things = [];


    
      const filtered = catData.filter((ele) => 
      items.every((item) => ele[category].includes(item))).map(ele => ele.scientific_name);
      
      selected.push(...filtered);



    return selected.filter(item => isInMammaliaData(item));
  }

  function getNewKey(category, items) {
    const selected = [];
    const things = [];

    for (let i = 0; i < items.length; i++) {
      const filtered = catData.filter((ele) => ele[category].includes(items[i])).map(ele => ele.scientific_name);
      selected.push(...filtered);

      for (let j = 0; j < filtered.length; j++) {
        things.push(items[i]);
      }
    }

    return combineArraysIntoObject(selected, things);
  }

  function getSpecies(category, items) {
    const selected = [];

    for (let i = 0; i < items.length; i++) {
      const filtered = catData.filter((ele) => ele[category].includes(items[i])).map(ele => ele.scientific_name);
      selected.push(...filtered);
    }

    return selected.filter(item => isInMammaliaData(item));
  }

  const handleMinMax = () => {
    let valuesArray = [];
    catData.forEach((item) => {
      if (item[category]) {
        let val = parseFloat(item[category]);
        let tempUnit = extractUnits(item[category]);
        let newval;
        if (tempUnit === "kg") {
          newval = val * 1000;
          setUnit("kg");
        } else if (tempUnit === "tons") {
          newval = val * 907.185;
          setUnit("g");
        } else {
          newval = val;
          setUnit(tempUnit);
        }
        if (!isNaN(newval)) {
          valuesArray.push(newval);
        }
      }
    });

    if (valuesArray.length > 0) {
      setUpper(Math.max(...valuesArray));
      setLower(Math.min(...valuesArray));
      setTempMinValue(Math.min(...valuesArray));
      setTempMaxValue(Math.max(...valuesArray));
    }
  };

  function extractUnits(text) {
    const match = text.match(/[a-zA-Z]+$/);
    return match ? match[0] : null;
  }


  const FindMaxValue = (value) => {
    
    if (value) {
    const valArray = value.split("|")
    const newArray = valArray.map((v) => convertWeight(v))
    return Math.max(...newArray)}

  }

  const convertWeight = (weight) => {
    let unit = extractUnits(weight);
    let value = parseFloat(weight);
    let newval;
    if (unit === "kg") {
      newval = value * 1000;
      setUnit("g");
    } else if (unit === "tons") {
      newval = value * 907.185;
      setUnit("g");
    } else {
      newval = value;
      setUnit(unit)
    }
    return newval;
  };


  const createKeyNumerical = async (species, cat) => {
    const targetData = catData.filter((ele) => species.includes(ele.scientific_name))
    const localKey = {};
    for (let obj in targetData) {
let tempNum = FindMaxValue(targetData[obj][cat]);

      localKey[targetData[obj].scientific_name] = tempNum;
      
    }
    return localKey;
  }

  const numericalFilter = async () => {
    const filteredSpecies = await catData.filter((ele) => (FindMaxValue(ele[category]) <= tempMaxValue) && (FindMaxValue(ele[category]) >= tempMinValue))
    .sort((a,b) => FindMaxValue(a[category]) - FindMaxValue(b[category])).map(ele => ele.scientific_name);
    
    updateFilter(filteredSpecies);
    const filtered = await filteredData.filter(item => filteredSpecies.includes(item.Name));
    const numericalKey = await createKeyNumerical(filteredSpecies, category)
    if (filtered.length > 0) {
      drawChart(filtered, svgRef, filteredSpecies, numericalKey);
    } else {
      console.warn('No data found for the selected IDs');
      d3.select(svgRef.current).selectAll("*").remove();
    }
  };

  const handleFilter = () => {
    const filteredSpecies = getFilteredSpecies(category, values);
    const tempKey = getNewKey(category, values);
    updateFilter(filteredSpecies);

    const filtered = filteredData.filter(item => filteredSpecies.includes(item.Name));

    if (filtered.length > 0) {
      drawChart(filtered, svgRef, filteredSpecies, tempKey);
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
                ))}
            </div>
          )}
          {!categoricals.includes(category) && (
            <div className="range_container">
              <div className="sliders_control">
                {/* <input
                  id="fromSlider"
                  type="range"
                  min={lowerLimit}
                  max={upperLimit}
                  value={tempMinValue}
                  onChange={handleSliderChange}
                />
                <input
                  id="toSlider"
                  type="range"
                  min={lowerLimit}
                  max={upperLimit}
                  value={tempMaxValue}
                  onChange={handleSliderChange}
                /> */}
              </div>
              <div>
                <span>{parseFloat(tempMinValue).toFixed(3)}</span> - <span>{parseFloat(tempMaxValue).toFixed(3)} {Unit}</span>
                <br />
                <input
                  type="text"
                  id="minInput"
                  value={tempMinValue}
                  onChange={handleInputChange}
                  placeholder="Min"
                />
                <input
                  type="text"
                  id="maxInput"
                  value={tempMaxValue}
                  onChange={handleInputChange}
                  placeholder="Max"
                />
                <br />
                <button onClick={applyFilter}>Apply</button>
              </div>
            </div>
          )}
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
