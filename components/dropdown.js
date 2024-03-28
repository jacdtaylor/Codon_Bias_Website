import { useState } from "react";
import catData from "../data/cleanedTraitData.json";

const Dropdown = () => {



  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [categories, setCat] = useState(Object.keys(catData[0]));
  const [categories2, setCat2] = useState("");

  const handleFilterChange = (e) => {
    setCountry(e.target.value);
    setState("");
  };

  const handleSecondFilterChange = (e) => {
    setState(e.target.value);
  };

  if (country === "habitat") {
  return (
    <div>
      <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleFilterChange} value={country}>
        <option disabled selected value="">-- Select Filter --</option>
        {categories.map(cat => (
                  <option value={cat}>{cat}</option>
                ))}
      </select>
      <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleSecondFilterChange} value={state} disabled={country === ""}>
                <option value="">-- Select Habitat --</option>
                {/* {country === "habitat" && (
                <><option key="Forest">Forest</option><option key="Ocean">Ocean</option><option key="Savannah">Savannah</option></>
                )} */}
            </select>
    </div>
  );
    } else {
        return (
            <div>
              <select className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md" onChange={handleFilterChange} value={country}>
                <option disabled selected value="">-- Select Filter --</option>
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