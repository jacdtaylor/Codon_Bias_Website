import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import Head from "next/head";
import { saveAs } from 'file-saver';
import allSpeciesData from "../data/speciesList.json";
import Order from "../data/codonOrder.json";
import { drawChart } from '../components/orthoHeatMap';
import taxo from '../data/taxoTranslator.json';
import commonNames from '../data/commonNameTranslator.json'
import groupDivider from '../data/orthoDivide.json';
import orthoWorker from 'worker-loader!../components/orthoWorker.js'; // Import the worker


const compareOrtho = () => {
    const svgRef1 = useRef();
    const svgRef2 = useRef();
    const svgRef3 = useRef();
    const [showLoader, setShowLoader] = useState(false)
    const [currentSVG, setCurrentSVG] = useState("");
    const [codonOrder, setCodonOrder] = useState([]);
    const [species, setSpecies] = useState("");
    const [allSpecies, setAllSpecies] = useState([]);
    const [currentSpeciesData, setCurrentSpeciesData] = useState({});
    const [currentGenes, setCurrentGenes] = useState([]);
    const [selectedGenes, setSelectedGenes] = useState([]);
    const [newId, setNewId] = useState("");
    const [taxoTranslator, setTaxoTranslator] = useState({});
    const [selectedSpeciesGenes, setSelectedSpeciesGenes] = useState([]);
    const [possibleGroups, setPossibleGroups] = useState([]);
    const [showGroups, setShowGroups] = useState(false);
    const [groupDivides, setGroupDivides] = useState([]);

    useEffect(() => {
        setAllSpecies(allSpeciesData);
        setCodonOrder(Order);
        setTaxoTranslator(taxo);
        setGroupDivides(groupDivider);
        setCurrentSVG(svgRef1);
    }, []);

   

    const downloadGraph = () => {
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
    };

    const handleSpeciesChange = (e) => {
        const selected = e.target.value;
        setSpecies(selected);
        handleDataChange(selected);
    };

    const handleInputChange = (e) => {
        setNewId(e.target.value);
    };

    const handleNameChange = () => {
        setTaxoTranslator(taxoTranslator === taxo ? commonNames : taxo);
    };

    const handleGeneChange = (gene) => {
        const proportionData = currentSpeciesData[gene][1];
        const AddedData = codonOrder.reduce((acc, key, index) => {
            acc[key] = proportionData[index];
            return acc;
        }, {});

        AddedData["Species"] = species;
        AddedData["Gene"] = gene;

        setSelectedSpeciesGenes([[species, gene], ...selectedSpeciesGenes]);
        setSelectedGenes([AddedData, ...selectedGenes]);
    };

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
                setCurrentGenes(Object.keys(data));
            })
            .catch(error => {
                console.error("Error fetching species data:", error);
            });
    };

    const HandleGraph = () => {
        if (selectedGenes.length == 0) {
            alert("No Genes Selected");
        } else {
        setShowLoader(false)
        drawChart(selectedGenes, currentSVG, taxoTranslator);}
    };

    const handleShowGroups = (id) => {
        let groups = currentSpeciesData[id][0];
        groups = groups.split(",");
        setPossibleGroups(groups);
        setShowGroups(true);
    };

    const selectOrthoGroup = (id) => {
        let i = 0;
        while (i < groupDivides.length) {
            if (id < groupDivides[i]) {
                break;
            }
            i++;
        }
        fetch(`OrthoGroups/GroupFile_${i}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch group data");
                }
                return response.json();
            })
            .then(data => {
                pullOrthoData(data[id])
                    .then(orthoData => {
                        setShowLoader(false);
                        drawChart(orthoData, currentSVG, taxoTranslator);
                    })
                    .catch(error => {
                        console.error("Error fetching ortho data:", error);
                    });
            });
    };

    const handleLoading = () => {
        d3.select(currentSVG.current).selectAll("*").remove();
        setShowLoader(true);
            
    };

    const setGraphNum = (ref) => {
        if (currentSVG.current) {
            currentSVG.current.style.display = "none";
        }
        if (ref.current) {
            ref.current.style.display = "block";
        }
        setCurrentSVG(ref);
    };

    const clearCurrent = () => {
        d3.select(currentSVG.current).selectAll("*").remove();
    }

    const clearGenes = () => {
        setSelectedSpeciesGenes([]);
        setSelectedGenes([]);
    }

    const pullOrthoData = async (sortedArray) => {
        const oData = [];
        const fetchPromises = sortedArray.map(async ([species, gene]) => {
            try {
                const response = await fetch(`speciesIndividualJSONS/${species}JSON.json`);
                if (!response.ok) {
                    throw new Error("Failed to fetch species data");
                }
                const data = await response.json();
                const proportionData = data[gene][1];

                const AddedData = codonOrder.reduce((acc, key, index) => {
                    acc[key] = proportionData[index];
                    return acc;
                }, {});

                AddedData["Species"] = species;
                AddedData["Gene"] = gene;

                oData.push(AddedData);
            } catch (error) {
                console.error("Error fetching data for", species, gene, error);
            }
        });

        await Promise.all(fetchPromises);
        return oData;
    };

    return (
        <>
            <link rel="stylesheet" href="Ortho.css"></link>
            <Head></Head>
            <Navbar />
            <div id="info-box" ></div>
            <span className='graphButtons'>
                <button onClick={() => setGraphNum(svgRef1)}>Graph 1</button>
                <button onClick={() => setGraphNum(svgRef2)}>Graph 2</button>
                <button onClick={() => setGraphNum(svgRef3)}>Graph 3</button>
            </span>
            <div className='Left_Column'>
                <select
                    className="Species_Input"
                    onChange={handleSpeciesChange}
                    value={species}
                >
                    <option disabled value="">
                        -- Select Species --
                    </option>
                    {allSpecies.map((cat) => (
                        <option key={cat} value={cat}>
                            {taxoTranslator[cat]}
                        </option>
                    ))}
                </select>

                <div className="input-container">
                    <input type="text" value={newId} onChange={handleInputChange} placeholder="Enter ID" />
                </div>
                <button onClick={handleNameChange}>Toggle Name</button>
                <button onClick={clearCurrent}>Clear Graph</button>
                <button onClick={clearGenes}>Clear Selected</button>

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
                                    <button onClick={() => { selectOrthoGroup(id); setShowGroups(false); handleLoading(); }}>
                                        {id}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <button onClick={HandleGraph}>Plot</button>
            </div>
            <div className="G_container">
                <div className="Graph">
                    {showLoader &&
                    <div class="loader"></div>}
                    <svg id="ID1" ref={svgRef1}></svg>
                    <svg id="ID2" ref={svgRef2} style={{ display: "none" }}></svg>
                    <svg id="ID3" ref={svgRef3} style={{ display: "none" }}></svg>
                </div>
                <button onClick={downloadGraph}>Download Graph</button>
            </div>
        </>
    );
};

export default compareOrtho;
