import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";

function Dropdown() {

  const [options, setSelectableOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [primary, setPrimary] = useState("");

  const toggleOption = (value) => {
    if (selectedOptions.includes(value)) {
      setSelectedOptions(selectedOptions.filter(option => option !== value));
    } else {
      setSelectedOptions([...selectedOptions, value]);
    }
  };

  useEffect(() => {
    setSelectableOptions([]);
    setSelectableOptions(
      (primary === "Colors") ? [{value:"red", label:"red"},{value:"blue", label:"blue"},{value:"green", label:"green"}] : 
      (primary === 'Shapes') ? [{value:"square", label:"square"},{value:"circle", label:"circle"},{value:"triangle", label:"triangle"}] :
      (primary === "Numbers") ?[{value:"1", label:"1"},{value:"2", label:"2"},{value:"3", label:"3"}] :
      []
    );
  }, [primary]);

  const HandlePrimaryDropdown = (e) => {
    setPrimary(e.target.value);
  };

  return (
    <>
    <Head>
       
    </Head>
    <Navbar />
    <div>
    <select onChange={HandlePrimaryDropdown} value={primary}>
        <option value="">Select item</option>
        <option value="Colors">Colors</option>
        <option value="Shapes">Shapes</option>
        <option value="Numbers">Numbers</option>
    </select>


      <div className="dropdown">
        <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Select Options
        </button>
        
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          {options.map(option => (
            <div key={option.value} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                value={option.value}
                id={option.value}
                checked={selectedOptions.includes(option.value)}
                onChange={() => toggleOption(option.value)}
              />
              <label className="form-check-label" htmlFor={option.value}>
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      <p>Selected Options: {selectedOptions.join(', ')}</p>
    </div>
    </>
  );
}

export default Dropdown;
