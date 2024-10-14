import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import Head from "next/head";
import { saveAs } from 'file-saver';
import allSpeciesData from "../data/speciesList.json";
import Order from "../data/codonOrder.json";
import { drawChart } from '../components/orthoHeatMap';
import taxo from '../data/taxoTranslator.json';
import groupDivider from '../data/orthoDivide.json';

const compareOrtho = () => {
    const svgRef = useRef();
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
        drawChart(selectedGenes, svgRef, taxoTranslator);
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
                        drawChart(orthoData,svgRef,taxoTranslator)
                    })
                    .catch(error => {
                        console.error("Error fetching ortho data:", error);
                    });
            });
    };

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
                        {taxo[cat]}
                    </option>
                ))}
            </select>
            
            <div className="input-container">
                <input type="text" value={newId} onChange={handleInputChange} placeholder="Enter ID" />
            </div>
            
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
                            {id}
                            <button onClick={() => handleGeneChange(id)} className = "geneButton">Add Gene</button>
                            <button onClick={() => handleShowGroups(id)} className = "geneButton">Show Groups</button>
                        </li>
                    ))}
            </ul>
            
            {showGroups && 
                possibleGroups.map((id, index) => (
                    <li className="checkbox-container" key={index}>
                        <button onClick={() => selectOrthoGroup(id)}>{id}</button>
                        <button onClick={() => setShowGroups(false)}>X</button>
                    </li>
                ))
            }
            
            <button onClick={HandleGraph}>Plot</button>
            </div>
            <div className="G_container">
                <div className="Graph">
                    <svg ref={svgRef}></svg>
                </div>
            </div>
            
            <div id="info-box"></div>
            
            <button onClick={downloadGraph}>Download Graph</button>
        </>
    );
};

export default compareOrtho;
