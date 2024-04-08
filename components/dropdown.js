import { useState } from "react";
import catData from "../data/cleanedTraitData.json";

const Dropdown = () => {

  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [categories, setCat] = useState(Object.keys(catData[0]));
  const [values, setVals] = useState("");
  const [categoricals, setCats] = useState(findCategoricals(catData));
  const [speciesList, setList] = useState("");

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
    console.log(speciesList);
    return speciesList;
  }

  function findCategoricals(data) {
    let categoricals = [];
    var keys = Object.keys(data[0]);
    // console.log(keys);
    let i = 0;
    let j = 0;
    while (i < keys.length) {
      var key = keys[i];
      // console.log(key);
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
          }
        }
        i++;
      }
      // console.log(categoricals);
      return categoricals;
    }

  function setValues(category) {
    let valueSet = new Set();
    for (let i = 0; i < catData.length; i++) {
      var vals = catData[i][category].split("|");
      for (let i = 0; i < vals.length; i++) {
        valueSet.add(vals[i]);
      }
    }
    let valueList = Array.from(valueSet);
    valueList = valueList.sort()
    if (valueList.includes("")) {
      delete valueList[valueList.indexOf("")];
    }
    return valueList;
  }

  const handleFilterChange = (e) => {
    setCategory(e.target.value);
    setVals(setValues(e.target.value));
    setValue("");
    setList(createSpeciesList(e.target.value));
  };

  const handleSecondFilterChange = (e) => {
    setValue(e.target.value);
    setList(createSpeciesList(category, e.target.value));
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
      <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleSecondFilterChange} value={value} disabled={category === ""}>
                <option value="">-- select {category} --</option>
                {values.map(val => (
                  <option value={val}>{val}</option>
                ))}
            </select>
    </div>
  );
    } else {
        return (
            <div>
              <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleFilterChange} value={category}>
                <option value="">-- select filter --</option>
                {/* <option value="Body Mass">Body Mass</option>
                <option value="Habitat">Habitat</option> */}
                {categories.map(cat => (
                  <option value={cat}>{cat}</option>
                ))}
              </select>
              </div>
    )};
};
export default Dropdown;

//look at behavioral circadian rhythm (The Nearctic)