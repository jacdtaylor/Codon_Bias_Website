import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import Head from "next/head";
import { saveAs } from 'file-saver';
import allSpeciesData from "../data/speciesList.json";
import Order from "../data/codonOrder.json"
import { drawChart } from '../components/orthoHeatMap';
import taxo from '../data/taxoTranslator.json';


const compareOrtho = () => {

    const svgRef = useRef();
    const [codonOrder,setCodonOrder] = useState([])
    const [species, setSpecies] = useState("");
    const [allSpecies, setAllSpecies] = useState([]);
    const [currentSpeciesData, setCurrentSpeciesData] = useState({});
    const [currentGenes, setCurrentGenes] = useState([]);
    const [selectedGenes, setSelectedGenes] = useState([]);
    const [newId, setNewId] = useState("");
    const [taxoTranslator, setTaxoTranslator] = useState({});
    const [selectedSpeciesGenes, setSelectedSpeciesGenes] = useState([]);
    const [possibleGroups, setPossibleGroups] = useState([])

    useEffect(() => {
        setAllSpecies(allSpeciesData);
        setCodonOrder(Order);
        setTaxoTranslator(taxo);
    }, []);

    const downloadGraph = () => {
        const svgElement = svgRef.current;
        const svgXML = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(svgXML);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight;
            context.drawImage(img, 0, 0);
            canvas.toBlob(blob => {
                saveAs(blob, 'graph.png');
            });
        };
    };

    const handleSpeciesChange = (e) => {
        const selected = e.target.value;
        setSpecies(selected);
        handleDataChange(selected);
    };

    const handleInputChange = (e) => {
        setNewId(e.target.value);
    };

    const handleGeneChange = (e) => {
        const selected = e;
        const proportionData = currentSpeciesData[selected][1];
        const AddedData = Order.reduce((acc, key, index) => {
            acc[key] = proportionData[index];
            return acc;
          }, {});

        AddedData["Species"] = species;
        AddedData["Gene"] = selected;
        // const AddedData = {"Species":species,"Gene":selected, "Data":currentSpeciesData[selected]}
        setSelectedSpeciesGenes([[species,selected],...selectedSpeciesGenes])
        setSelectedGenes([AddedData, ...selectedGenes]);
    }


    const handleDataChange = (item) => {
        fetch(`speciesIndividualJSONS/${item}JSON.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch species data");
                }
                return response.json();
            })
            .then(data => {
                setCurrentSpeciesData(data);
                setCurrentGenes(Object.keys(data))
            })
            .catch(error => {
                console.error("Error fetching species data:", error);
            });
    };

    const HandleGraph = () => {
        drawChart(selectedGenes, svgRef, taxoTranslator)
    }

    const handleShowGroups = (id) => {
        groups = currentSpeciesData.id[0];
        groups = groups.split(",");
        setPossibleGroups(groups);
    }

    return (
        <>
        <link rel="stylesheet" href="filter.css"></link>
        <Head></Head>
        <Navbar />
        <select
            className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md"
            onChange={handleSpeciesChange}
            value={species}
        >
            <option disabled value="">
              -- Select Species --
            </option>
            {allSpecies.map((cat) => (
                <option key={cat} value={cat}>
                  {taxo[cat]}
                </option>
            ))}
        </select>
        {/* <select
            className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md"
            onChange={handleGeneChange}
            // value={Gene}
        >
            <option disabled value="">
              -- Select Gene --
            </option>
            {currentGenes.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
            ))}
        </select> */}

        <div className="input-container">
            <input type="text" value={newId} onChange={handleInputChange} placeholder="Enter ID" />
        </div>
        <ul className="GeneNamesUl">
        {currentGenes
            .filter(id => id.toLowerCase().startsWith(newId.toLowerCase()))
            .filter(id => !new Set(
                selectedSpeciesGenes
                  .filter(item => item[0] === species) // Filter by species
                  .map(item => item[1])                      // Extract the genes for the current species
              ).has(id)
              )
            .slice(0, 30)
            .map((id, index) => (
                <li className="GeneNamesLi" key={index}>
                    {id}
                    <button onClick={() => handleGeneChange(id)}>Add Gene</button>
                    <button onClick={() => handleShowGroups(id)}>Show Groups</button>
                </li>
            ))}
    </ul>
        <button onClick={HandleGraph}>Plot</button>
        <container className="G_container">
            <container className="Graph">
            <svg ref={svgRef}></svg>
            </container>
            </container>
                <div id="info-box" ></div>

        <button onClick={downloadGraph}>Download Graph</button>
        </>
    );
};

export default compareOrtho;
