import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import Head from "next/head";
import { saveAs } from 'file-saver';
import allSpeciesData from "../data/speciesList.json";
import Order from "../data/codonOrder.json";
import { drawChart } from '../components/orthoHeatMap';
import taxo from '../data/taxoTranslator.json';
import commonNames from '../data/commonNameTranslator.json';
import groupDivider from '../data/orthoDivide.json';
import cladeDict from '../data/cladeJSON.json'
import classTranslator from "../data/classTranslator.json"

const compareOrtho = () => {

    const svgRef1 = useRef();
    const svgRef2 = useRef();
    const svgRef3 = useRef();
    const [currentSVG, setCurrentSVG] = useState("");

    const [selectedGenes1, setSelectedGenes1] = useState([]);
    const [selectedSpeciesGenes1, setSelectedSpeciesGenes1] = useState([]);
    const [selectedGenes2, setSelectedGenes2] = useState([]);
    const [selectedSpeciesGenes2, setSelectedSpeciesGenes2] = useState([]);
    const [selectedGenes3, setSelectedGenes3] = useState([]);
    const [selectedSpeciesGenes3, setSelectedSpeciesGenes3] = useState([]);

    const [selectedGenes, setSelectedGenes] = useState([]);
    const [selectedSpeciesGenes, setSelectedSpeciesGenes] = useState([]);

    const [allSpecies, setAllSpecies] = useState([]);
    const [codonOrder, setCodonOrder] = useState([]);
    const [taxoTranslator, setTaxoTranslator] = useState({});
    const [groupDivides, setGroupDivides] = useState([]);
    const [possibleGroups, setPossibleGroups] = useState([]);

    const [newId, setNewId] = useState("");
    const [species, setSpecies] = useState("");
    const [currentGenes, setCurrentGenes] = useState([]);
    const [currentSpeciesData, setCurrentSpeciesData] = useState({});

    const [showGroups, setShowGroups] = useState(false);
    const [showSelected, setShowSelected] = useState(false);
    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        setAllSpecies(allSpeciesData);
        setCodonOrder(Order);
        setTaxoTranslator(taxo);
        setGroupDivides(groupDivider);
        setCurrentSVG(svgRef1);
    }, []);

    useEffect(() => {
        if (selectedGenes.length > 0) {
            HandleGraph();
        } else {
            d3.select(currentSVG.current).selectAll("*").remove();
        }
    }, [taxoTranslator, selectedGenes]);

    useEffect(() => {
        HandleSelected();
    }, [selectedGenes]);

    // --- Taxonomic clade and digit extraction functions (now handled by TaxoClade component) ---
    function extractDigits(code) {
        const parts = code.split('@');
        return parts.length > 1 ? parts[1] : null;
    }

    const handleGraphNum = (svg) => {
        if (currentSVG.current) {
            currentSVG.current.style.display = "none";
        }
        if (svg.current) {
            svg.current.style.display = "block";
        }
        if (currentSVG === svgRef1) {
            setSelectedGenes1(selectedGenes);
            setSelectedSpeciesGenes1(selectedSpeciesGenes);
        } else if (currentSVG === svgRef2) {
            setSelectedGenes2(selectedGenes);
            setSelectedSpeciesGenes2(selectedSpeciesGenes);
        } else {
            setSelectedGenes3(selectedGenes);
            setSelectedSpeciesGenes3(selectedSpeciesGenes);
        }

        if (svg === svgRef1) {
            setCurrentSVG(svgRef1);
            setSelectedGenes(selectedGenes1);
            setSelectedSpeciesGenes(selectedSpeciesGenes1);
        }
        else if (svg === svgRef2) {
            setCurrentSVG(svgRef2);
            setSelectedGenes(selectedGenes2);
            setSelectedSpeciesGenes(selectedSpeciesGenes2);
        }
        else {
            setCurrentSVG(svgRef3);
            setSelectedGenes(selectedGenes3);
            setSelectedSpeciesGenes(selectedSpeciesGenes3);
        }
    };


    function extractTaxId(code) {
        if (typeof code !== 'string') {
          console.warn("extractTaxId: Expected a string but got:", code);
          return null;
        }
      
        const match = code.split("at")[1];
        console.log(match)
        return match 
      }

    const handleSpeciesChange = (e) => {
        const selected = e.target.value;
        setSpecies(selected);
        handleDataChange(selected);
    };

    const handleRemoveGene = (indexToRemove) => {
        setSelectedGenes(selectedGenes => selectedGenes.filter((item, index) => index !== indexToRemove));
    };

    const handleInputChange = (e) => {
        setNewId(e.target.value);
    };

    const handleNameChange = () => {
        setTaxoTranslator(taxoTranslator === taxo ? commonNames : taxo);  
    };

    const handleGeneChange = async (gene) => {
        const response = await fetch(`/api/dbQuery?species=${species}&gene=${gene}`);
        if (!response.ok) {
            throw new Error('Error fetching data');
        }
        const data = await response.json(); // Await the resolved JSON
        const proportionData = data["Proportions"];

        const AddedData = codonOrder.reduce((acc, key, index) => {
            acc[key] = proportionData[index];
            return acc;
        }, {});

        AddedData["Species"] = species;
        AddedData["Gene"] = gene;

        setSelectedGenes([AddedData, ...selectedGenes]);
    };

    const HandleSelected = () => {
        const temporaryArray = selectedGenes.map(entry => [entry["Species"], entry["Gene"]]);
        setSelectedSpeciesGenes(temporaryArray);
    };

    const HandleSelectedDisplay = () => {
        setShowGroups(false);
        setShowSelected(!showSelected);
    };

    const handleDataChange = async (item) => {
        const response = await fetch(`/api/geneNameQuery?species=${item}`);
        if (!response.ok) {
            throw new Error('Error fetching data');
        }
        const data = await response.json();
        setCurrentGenes(data);
    };

    const HandleGraph = () => {
        if (selectedGenes.length === 0) {
            alert("No Genes Selected");
        } else {
            setShowLoader(false);
            drawChart(selectedGenes, currentSVG, taxoTranslator);
        }
    };

    const handleShowGroups = async (id) => {
        const response = await fetch(`/api/dbQuery?species=${species}&gene=${id}`);
        if (!response.ok) throw new Error("Failed to fetch data from API");

        const data = await response.json();
        
        let groups = data["orthoGroups"];
       
        groups = groups.split(",");
        
        if (groups[0] == "No_Groups_Found") {alert("No Orthologous Groups Found")}
        else{
        setPossibleGroups(groups);
        setShowGroups(true);}
    };

    const selectOrthoGroup = async (id) => {
        const response = await fetch(`/api/orthoQuery?orthoID=${id}`);
        if (!response.ok) throw new Error("Failed to fetch data from API");
    
        const data = await response.json();
        console.log(data);
    
        pullOrthoData(data['species']).then(orthoData => {
            setShowLoader(false);
            setSelectedGenes(orthoData);
            drawChart(orthoData, currentSVG, taxoTranslator);
        });
    };

    const handleLoading = () => {
        d3.select(currentSVG.current).selectAll("*").remove();
        setShowLoader(true);
    };

    const clearCurrent = () => {
        d3.select(currentSVG.current).selectAll("*").remove();
        setSelectedSpeciesGenes([]);
        setSelectedGenes([]);
        if (currentSVG === svgRef1) {
            setSelectedGenes1([]);
            setSelectedSpeciesGenes1([]);
        } else if (currentSVG === svgRef2) {
            setSelectedGenes2([]);
            setSelectedSpeciesGenes2([]);
        } else {
            setSelectedGenes3([]);
            setSelectedSpeciesGenes3([]);
        }   
    };

    const downloadGraph = () => {
        if (selectedGenes.length > 0) {
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

    const pullOrthoData = async (sortedArray) => {
        const oData = [];
        
        // Helper function to process each item
        const processItem = async ([species, gene]) => {
            try {
                const response = await fetch(`/api/dbQuery?species=${species}&gene=${gene}`);
                if (!response.ok) throw new Error("Failed to fetch data from API");
    
                const data = await response.json();
                const proportionData = data["Proportions"];
    
                const AddedData = codonOrder.reduce((acc, key, index) => {
                    acc[key] = proportionData[index];
                    return acc;
                }, { Species: species, Gene: gene });
    
                return AddedData;
            } catch (error) {
                console.error("Error fetching data for", species, gene, error);
                return null;
            }
        };
    
        for (let i = 0; i < sortedArray.length; i++) {
            const [species, gene] = sortedArray[i];
            const result = await processItem([species, gene]);
            if (result) {
                oData.push(result);
            }
        }
    
        return oData;
    };
    
    return (
        <>
            <link rel="stylesheet" href="Ortho.css" />
            <Head />
            <Navbar />
            <div id="info-box" ></div>
            <span className='graphButtons'>
                <button onClick={() => handleGraphNum(svgRef1)}>Graph 1</button>
                <button onClick={() => handleGraphNum(svgRef2)}>Graph 2</button>
                <button onClick={() => handleGraphNum(svgRef3)}>Graph 3</button>
            </span>
            <div className='Left_Column'>
                <h1 style={{ width: '100%', padding: '10px', paddingBottom: '20px', fontSize: '20px'}}>
                Search by Ortholog Group
                </h1>
                <select
                    className="Species_Input"
                    onChange={handleSpeciesChange}
                    value={species}
                >
                    <option disabled value="">
                        -- Select Species --
                    </option>
                    {allSpecies
                    .filter((cat) => taxoTranslator.hasOwnProperty(cat))
                    .map((cat) => (
                        <option key={cat} value={cat}>
                        {taxoTranslator[cat]}
                        </option>
                    ))}
                </select>

                <div className="input-container">
                    <input type="text" value={newId} onChange={handleInputChange} placeholder="Enter ID" />
                </div>
                <container className="Column_Buttons">
                    <button onClick={handleNameChange}>Toggle Name</button>
                    <button onClick={clearCurrent}>Clear Selected</button>
                    <button onClick={HandleSelectedDisplay}>Show Selected</button>
                </container>

                <ul className="GeneNamesUl">
                    {currentGenes
                        .filter(id => id.toLowerCase().startsWith(newId.toLowerCase()))
                        .filter(id => !new Set(
                            selectedSpeciesGenes
                                .filter(item => item[0] === species)
                                .map(item => item[1])
                        ).has(id))
                        .slice(0, 30)
                        .map((id, index) => (
                            <li className="GeneNamesLi" key={index}>
                                <div>{id}</div>
                                <div>
                                    <button onClick={() => handleGeneChange(id)} className="geneButton">Add Gene</button>
                                    <button onClick={() => handleShowGroups(id)} className="geneButton">Show Groups</button>
                                </div>
                            </li>
                        ))}
                </ul>

                {showGroups && (
                    <div className="checkbox-container">
                        <button onClick={() => setShowGroups(false)} className="close-button">Close Menu</button>
                        <ul>
                            {possibleGroups.map((id, index) => (
                                <li key={index}>
                                    <button onClick={() => { 
                                        selectOrthoGroup(id); 
                                        setShowGroups(false); 
                                        handleLoading(); 
                                    }}>
                                        {cladeDict[extractTaxId(id)]}
                                        
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {showSelected && (
                    <div className="checkbox-container">
                        <button onClick={() => setShowSelected(false)} className="close-button">Close Menu</button>
                        <ul>
                            {selectedSpeciesGenes.map((item, index) => (
                                <li key={index}>
                                    <button>
                                        {taxoTranslator[item[0]]}, {item[1]}
                                    </button>
                                    <button onClick={() => handleRemoveGene(index)}>Remove</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <button onClick={downloadGraph} className="Download">Download Graph</button>
            </div>
            <div className="G_container">
                <div className="Graph">
                    {showLoader &&
                        <div className="loader">
                            {/* Loader can be styled with CSS */}
                        </div>
                    }
                    <svg id="ID1" ref={svgRef1}></svg>
                    <svg id="ID2" ref={svgRef2} style={{ display: "none" }}></svg>
                    <svg id="ID3" ref={svgRef3} style={{ display: "none" }}></svg>
                </div>
            </div>
        </>
    );
};

export default compareOrtho;
