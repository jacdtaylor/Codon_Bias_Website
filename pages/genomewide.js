import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import Head from "next/head";
import { saveAs } from 'file-saver';
import Order from "../data/codonOrder.json";
import { drawChart } from '../components/genomeGraph';
import taxo from '../data/taxoTranslator.json';
import commonNames from '../data/commonNameTranslator.json';
import groupDivider from '../data/orthoDivide.json';
import classTranslator from "../data/classTranslator.json"


const genomeWide = () => {
    const svgRef1 = useRef();
    const svgRef2 = useRef();
    const svgRef3 = useRef();
    const [currentSVG, setCurrentSVG] = useState("");

    const [species, setSpecies] = useState([]);
    const [currentGenes, setCurrentGenes] = useState([]);
    const [taxoTranslator, setTaxoTranslator] = useState({});
    const [allSpeciesData, setAllSpecies] = useState([]);
    const [filteredSpecies, setFilteredSpecies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentClasses, setCurrentClasses] = useState(["mammalia","fungi","viridiplantae","vertebrate-other","invertebrate", "protozoa", "archaea"])
    const allClasses = ["mammalia","fungi","viridiplantae","vertebrate-other","invertebrate", "protozoa", "archaea"];
    const [showGroups, setShowGroups] = useState(false);

    useEffect(() => {
        setTaxoTranslator(taxo);
        setCurrentSVG(svgRef1);
        handleSpeciesList();
    }, []);


    useEffect(() => {
        if (species.length > 0) {
            handleDataChange(species);
        } else {
            d3.select(currentSVG.current).selectAll("*").remove();
        }
    }, [species]);



   
 
  
    const handleCheckboxChange = (className) => {
      setCurrentClasses((prev) =>
        prev.includes(className)
          ? prev.filter((cls) => cls !== className) // Remove if already selected
          : [...prev, className] // Add if not selected
      );
    };
  
    const handleSelectAll = () => {
      setCurrentClasses(currentClasses.length === allClasses.length ? [] : allClasses);
    };

    const handleSpeciesList = async () => {
  
        try {
            const response = await fetch(`/api/speciesListQuery/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch species list: ${response.statusText}`);
            }
    
            const data = await response.json();
            if (data && data.species) {
                setAllSpecies(data.species); // Update the species list
                setFilteredSpecies(data.species)
            } else {
                console.error("No species data found in the response.");
                alert("Failed to load species list. Please try again later.");
            }
        } catch (error) {
            console.error("Error fetching species list:", error);
            alert("Error fetching species list. Please check your network connection and try again.");
        } 
        
    };

    const handleGraphNum = (svg) => {
        if (currentSVG.current) {
            currentSVG.current.style.display = "none";
        }
        if (svg.current) {
            svg.current.style.display = "block";
        }
        setCurrentSVG(svg);
    };

    const handleSpeciesChange = (e) => {
        const selectedSpecies = Array.from(e.target.selectedOptions, option => option.value);
        setSpecies([...species ,...selectedSpecies]);
        console.log([...species ,...selectedSpecies])
    };

    function convertIdentifier(input) {
        return input.replace(/_(\d+)$/, '.$1');
    }

    const handleNameChange = () => {
        setTaxoTranslator(prev => {
            const newTranslator = prev === taxo ? commonNames : taxo;
            drawChart(currentGenes, currentSVG, newTranslator); // Ensure it uses the updated translator
            return newTranslator;
        });
    };

    const handleDataChange = async (selectedSpeciesArray) => {
        console.log(selectedSpeciesArray);
     
    
        try {
            const dataPromises = selectedSpeciesArray.map((speciesName) =>
                fetch(`/api/genomeQuery?species=${convertIdentifier(speciesName)}`).then((response) => response.json())
            );
    
            const dataArray = await Promise.all(dataPromises);
    
            // Update state using a callback to ensure the latest state is used
            setCurrentGenes((prevGenes) => {
                const updatedGenes = [ ...dataArray];
                console.log("Updated Genes:", updatedGenes);
    
                // Trigger graph rendering after state update
                drawChart(updatedGenes, currentSVG, taxoTranslator);
                return updatedGenes;
            });
        } catch (error) {
            console.error("Error fetching genome data:", error);
            alert("Error fetching genome data. Please try again.");
        } 
    };

    const HandleGraph = () => {
        if (currentGenes.length === 0) {
            alert("No data available for selected species");
        } else {
            drawChart(currentGenes, currentSVG, taxoTranslator);
        }
    };

    const clearCurrent = () => {
        d3.select(currentSVG.current).selectAll("*").remove();
        setCurrentGenes([]);
        setSpecies([])
    };

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 0) {
            const results = allSpeciesData.filter(speciesName => 
                taxoTranslator[speciesName.replace(".", "_")]
                ?.toLowerCase()
                .includes(term.toLowerCase())
            );
            setFilteredSpecies(results);
        } else {
            setFilteredSpecies(allSpeciesData);
        }
    };

    const downloadGraph = () => {
        if (currentGenes.length > 0) {
            const svgElement = currentSVG.current;
            if (!svgElement) return;
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
        }
    };

    return (
        <>
            <link rel="stylesheet" href="Ortho.css"></link>
            <Head></Head>
            <Navbar />
            <div id="info-box"></div>
            <div id="class-box"></div>

            <span className='graphButtons'>
                <button onClick={() => handleGraphNum(svgRef1)}>Graph 1</button>
                <button onClick={() => handleGraphNum(svgRef2)}>Graph 2</button>
                <button onClick={() => handleGraphNum(svgRef3)}>Graph 3</button>
            </span>

            <div className='Left_Column'>
            <h1 style={{ width: '100%', padding: '10px', paddingBottom: '20px', fontSize: '20px'}}>
                Genome-Wide Selection
                </h1>
            <div className='input-container'>
                    <input
                        type='text'
                        className='Species_Input'
                        placeholder='Search for a species...'
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                
                <select
                    className="Species_Input"
                    onChange={handleSpeciesChange}
                    value={species}
                    multiple
                >
                    {filteredSpecies
                .filter(speciesName => currentClasses.includes(classTranslator[speciesName.replace(".", "_")]))
                .filter(speciesName => !species.includes(speciesName)) 
                .filter((speciesName) => taxoTranslator.hasOwnProperty(speciesName.replace(".", "_")))
                .map(speciesName => (
                <option key={speciesName} value={speciesName}>
                {taxoTranslator[speciesName.replace(".", "_")]}
                </option>
                ))}
                </select>
                    
                <container className="Column_Buttons">
                    <button onClick={handleNameChange}>Toggle Name</button>
                    <button onClick={clearCurrent}>Clear Graph</button>
                </container>

                <div>
                <button onClick={handleSelectAll}>
                    {currentClasses.length === allClasses.length ? "Deselect All" : "Select All"}
                </button>
                <ul className="classUl">
                {allClasses.map((className) => (
                    
                        <li className="classLi" key={className}>

                    <input
                        type="checkbox"
                        checked={currentClasses.includes(className)}
                        onChange={() => handleCheckboxChange(className)}
                    />
                    <label>{className}</label>
                    </li>
                ))}
                </ul>
                </div>

                <button onClick={downloadGraph} className="Download">Download Graph</button>
            </div>

            <div className="G_container">
                <div className="Graph">
                    <svg id="ID1" ref={svgRef1}></svg>
                    <svg id="ID2" ref={svgRef2} style={{ display: "none" }}></svg>
                    <svg id="ID3" ref={svgRef3} style={{ display: "none" }}></svg>
                </div>
            </div>
        </>
    );
};

export default genomeWide;
