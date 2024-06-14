import { useState } from "react";
import catData from "../data/cleanedTraitData.json";

const Dropdown = () => {

  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [categories, setCat] = useState(Object.keys(catData[0]));
  const [values, setVals] = useState("");
  const [categoricals, setCats] = useState(findCategoricals(catData, "categorical"));
  const [numericals, setNums] = useState(findCategoricals(catData, "numerical"));
  const [speciesList, setList] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  
  // This function takes the filters and returns a list of the species that meets the filters. 
  // It is currently in alphabetical order, but we'll need to change the continuous variables to put the species in ascending or descending order based on the numbers.

  function createSpeciesList(filter, filter2) {
    let speciesList = [];
    if (arguments.length === 1) {
      for (let i = 0; i < catData.length; i++) {
        if (catData[i][filter] != "") {
          speciesList = speciesList.concat(catData[i]["scientific_name"]);
        }
      }
    } else if (arguments.length === 2) {
      for (let i = 0; i < catData.length; i++) {
        if (catData[i][filter] != "") {
          var list = catData[i][filter].split("|");
          if (list.includes(filter2)) {
            speciesList = speciesList.concat(catData[i]["scientific_name"]);
          }
        }
      }
    }
    speciesList = speciesList.sort();
    // console.log(speciesList);
    return speciesList;
  }


  // This function determines which filters are categorical and which are numerical.
  // It returns a list of the categorical filters.

  function findCategoricals(data, filter) {
    let categoricals = [];
    let numericals = [];
    var keys = Object.keys(data[0]);
    let i = 0;
    let j = 0;
    while (i < keys.length) {
      var key = keys[i];
      var val = data[j][key];
      if (val === "") {
        j++;
        continue;
      } else {
        val = val.split("|")[0];
        if (val.includes(" ")) {
          val = val.split(" ")[0];
        }
          val = parseFloat(val);
          if (isNaN(val)) {
            categoricals = categoricals.concat(key);
            j = 0;
          } else {
            numericals = numericals.concat(key);
          }
        }
        i++;
      }
      if (filter === "categorical") {
        return categoricals;
      } else if (filter === "numerical") {
        return numericals;
      }
    }


    // This function creates and returns the list of options for the second dropdown for the categorical filters.

  function setValues(category) {
    let valueSet = new Set();
    for (let i = 0; i < catData.length; i++) {
      if (catData[i][category] !== undefined && catData[i][category] !== null) {
        var vals = catData[i][category].split("|");
        for (let j = 0; j < vals.length; j++) {
          valueSet.add(vals[j]);
        }
      }
    }
    let valueList = Array.from(valueSet);
    valueList = valueList.sort()
    if (valueList.includes("")) {
      delete valueList[valueList.indexOf("")];
    }
    // if (filter === "numerical") {
    //   let numList = [];
    //   for (let index in valueList) {
    //     var justNum = valueList[index];
    //     // console.log(justNum);
    //     justNum = justNum.split(" ")[0];
    //     var num = parseFloat(justNum);
    //     numList.push(num);
    //   }
    //   return numList;
    // }
    console.log(valueList);
    return valueList;
  }


  // This handles the first dropdown by implementing several of the above functions.

  const handleFilterChange = (e) => {
    var cat = e.target.value;
    setCategory(cat);
    setVals(setValues(cat));
    console.log(values);
    if (numericals.includes(e.target.value)) {
      setMin(values[0].substring(0, values.length-2));
      console.log(min);
      setMax(values[values.length-1].substring(0, values.length-2));
      console.log(max);
    }
    setVals(setValues(e.target.value));
    setValue("");
    setList(createSpeciesList(e.target.value));
  };

  // const handleCatFilterChange = (e) => {
  //   setCategory(e.target.value);
  //   setVals(setValues(e.target.value));
  //   setValue("");
  //   setList(createSpeciesList(e.target.value));
  // };

  // const handleNumFilterChange = (e) => {
  //   setCategory(e.target.value);
  //   setVals(setValues(e.target.value));
  //   console.log(values);
  //   setMin(values.at(0).split(" ").at(0));
  //   setMax(values.at(values.length-1).split(" ").at(0));
  //   setValue("");
  //   setList(createSpeciesList(e.target.value));
  // };
  
  
  // This handles the second dropdown (only for categorical filters) by implementing several of the above functions.

  const handleCatFilterChange2 = (e) => {
    setValue(e.target.value);
    setList(createSpeciesList(category, e.target.value));
  };

  const handleNumFilterChange2 = (e) => {
    setValue(e.target.value);

  };

  if (categoricals.includes(category)) {
    return (
      <div>
        <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleFilterChange} value={category}>
          <option disabled selected value="">-- select filter --</option>
          {categories.map(cat => (
                    <option value={cat}>{cat}</option>
                  ))}
        </select>
        <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleCatFilterChange2} value={value} disabled={category === ""}>
                  <option value="">-- select {category} --</option>
                  {values.map(val => (
                    <option value={val}>{val}</option>
                  ))}
        </select>
      </div>
    );
  } else if (numericals.includes(category)) {
    return (
      <div>
        <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleFilterChange} value={category}>
          <option disabled selected value="">-- select filter --</option>
          {categories.map(cat => (
                    <option value={cat}>{cat}</option>
                  ))}
        </select>
        <p>{value}</p>
        <div className="slidecontainer">
          <input type="range" min={min} max={max} step="0.0001" onChange={handleNumFilterChange2} value={value} className="slider" id="myRange"></input>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleFilterChange} value={category}>
          <option value="">-- select filter --</option>
          {categories.map(cat => (
            <option value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    )};
};
export default Dropdown;