import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import humanData from '../data/proportions/humanCodon.json';
import Navbar from "../components/navbar";
import DarkSwitch from "../components/DarkSwitch.js"
import Head from "next/head";
import { ClusterCodonData } from "../components/cluster.js";
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import taxo from '../data/taxoTranslator.json';
import VertebrateJSON from '../data/proportions/vertebrateExampleJSON.json'
import Order from "../data/codonOrder.json";
import allSpeciesData from "../data/speciesList.json";
import { drawChart } from "../components/orthoHeatMap.js";





const Filter = () => {

    const [gene, setGene] = useState('');
    const [species, setSpecies] = useState('');
    const [currSpecGenes, setCurrSpecGenes] = useState([]);
    const [proportionData, setProportionData] = useState({});
    const [speciesAndGenes, setSpeciesAndGenes] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    const [countToggle, setCountToggle] = useState(false);
    const [allSpecies, setAllSpecies] = useState([]);
    const [codonOrder, setCodonOrder] = useState([]);
    const [taxoTranslator, setTaxoTranslator] = useState({});
    const [reverseTranslator, setReverseTranslator] = useState({});
    const [showLoader, setShowLoader] = useState(false)
    const graph = useRef();

    useEffect(() => {
        setAllSpecies(allSpeciesData || []);
        setCodonOrder(Order || []);
        setTaxoTranslator(taxo || {});
        reverseTranslate(taxo);
    }, []);

    useEffect(() => {
        if (species) {
            handleDataChange(species);
        }
    }, [species]);

  useEffect(() => {
      if (Object.keys(speciesAndGenes).length > 0) {
          HandleGraph();
      } else {
          d3.select(graph.current).selectAll("*").remove();
      }
  }, [taxoTranslator, speciesAndGenes]);

    const handleAddId = () => {
        if (currSpecGenes.includes(gene) | gene.includes(",")) {
            const idsToAdd = gene.split(',').map(id => id.trim());
            setSpeciesAndGenes(prevState => ({
                ...prevState,
                [species]: [...new Set([...(prevState[species] || []), ...idsToAdd])]
            }));
            
            setGene('');
        }
        else {
            alert("Gene Name Not Found.");
        }
    };

    const HandleCountToggle = () => {
        setCountToggle(!countToggle);
    }

    const handleRemoveId = (idToRemove) => {
        const [species, gene] = idToRemove.split(' - ');
        const speciesId = reverseTranslator[species];
    
        setSpeciesAndGenes(prevIds => {
            if (!prevIds[speciesId]) return prevIds; // If species doesn't exist, return unchanged
    
            const updatedGenes = prevIds[speciesId].filter(g => g !== gene);
    
            // If no genes are left, remove the species key entirely
            const updatedSpeciesAndGenes = { ...prevIds };
            if (updatedGenes.length > 0) {
                updatedSpeciesAndGenes[speciesId] = updatedGenes;
            } else {
                delete updatedSpeciesAndGenes[speciesId];
            }
    
            return updatedSpeciesAndGenes;
        });
    };
    

    const handleSelectSuggestion = (suggestion) => {
        setSpeciesAndGenes(prevState => ({
            ...prevState,
            [species]: [...new Set([...(prevState[species] || []), suggestion])]
        }));
        // console.log('Translator:', taxoTranslator);
        // console.log('Reverse Translator:', reverseTranslator);
    };
    

    const handleClick = () => {
        setIsVisible(!isVisible);
      };

    const downloadGraph = () => {
        // Select the SVG element
        const svgElement = graph.current;
    
        // Get the SVG XML string
        const svgXML = new XMLSerializer().serializeToString(svgElement);
    
        // Create an image element
        const img = new Image();
    
        // Set the image source to the SVG XML
        img.src = 'data:image/svg+xml;base64,' + btoa(svgXML);
    
        // When the image loads
        img.onload = () => {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
    
            // Set canvas size to match SVG size
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight;
    
            // Draw the image onto the canvas
            context.drawImage(img, 0, 0);
    
            // Convert canvas to blob
            canvas.toBlob(blob => {
                // Save blob as file using FileSaver.js
                saveAs(blob, 'graph.png');
            });
        };
    };

    const handleGeneChange = async (gene) => {
        try {
          const response = await fetch(`/api/dbQuery?species=${species}&gene=${gene}`);
          if (!response.ok) throw new Error("Error fetching data");
      
          const data = await response.json();
          console.log("Fetched data:", data);
          
          const proportionData = data["Proportions"];
          const AddedData = codonOrder.reduce((acc, key, index) => {
            acc[key] = proportionData[index];
            return acc;
          }, { Species: species, Gene: gene });
      
          setProportionData(AddedData);
        } catch (error) {
          console.error(error);
        }
      };
      
    
    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }
        const newSelectedIds = [];

        Object.entries(speciesAndGenes).forEach(([key, values]) => {
            values.forEach(value => {
                newSelectedIds.push(`${key} - ${value}`);
            });
        });
    
        // Reorder based on drag-and-drop result
        const [reorderedItem] = newSelectedIds.splice(result.source.index, 1);
        newSelectedIds.splice(result.destination.index, 0, reorderedItem);
    
        console.log(newSelectedIds); // Check the output
    };
    
    

    const handleInputChange = (e) => {
        setGene(e.target.value);
    };

    const handleSpeciesChange = (e) => {
        const selected = e.target.value;
        setSpecies(selected);
        handleDataChange(selected);
    };

    const handleDataChange = async (item) => {
        setSpecies(item); // Update species state
        
        // Ensure the species exists in speciesAndGenes without mutating state
        setSpeciesAndGenes(prevState => ({
            ...prevState,
            [item]: prevState[item] || []
        }))
        console.log('Species and Genes:', speciesAndGenes);
    
        try {
            const response = await fetch(`/api/geneNameQuery?species=${item}`);
            if (!response.ok) {
                throw new Error('Error fetching data');
            }
            
            const data = await response.json();
            console.log(data);
            setCurrSpecGenes(data);
        } catch (error) {
            console.error(error);
        }
    };

    async function reverseTranslate(taxoTranslator) {
        const reverseRef = {};
        for (const key of Object.keys(taxoTranslator)) {
          reverseRef[taxoTranslator[key]] = key;
        }
        setReverseTranslator(reverseRef); // Still asynchronous
        return reverseRef; // Return the updated object
      }

    const handleLoading = () => {
        d3.select(graph.current).selectAll("*").remove();
        // setShowDownload(false);
        setShowLoader(true);
        };

    const HandleGraph = async () => {
        if (Object.keys(speciesAndGenes).length === 0) {
          alert("No Species Selected");
          return;
        }
      
        // handleLoading(); // Clear the graph and show the loader
      
        try {
          
          const array = [];
  
          console.log(Object.keys(speciesAndGenes));
          for (const key of Object.keys(speciesAndGenes)) {
            for (const gene of speciesAndGenes[key]) {
              array.push([key, gene]);
            }
          }
      
          console.log("Array for pullOrthoData:", array[array.length - 1]);
      
          // Fetch and process data
          const formatted = await pullOrthoData(array);

        //   setFormattedData(prevState => ({...prevState, formatted}))
          
          console.log("Formatted data:", formatted);
          
      
          if (formatted.length === 0) {
            // alert("No data to display");
            setShowLoader(false);
            return;
          }
      
          setShowLoader(false);
          drawChart(formatted, graph, taxoTranslator);
        //   setShowDownload(true);
        } catch (error) {
          console.error("Error in HandleGraph:", error);
          setShowLoader(false);
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
            <link rel="stylesheet" href="filter.css"></link>
            <Head>
            </Head>
            <Navbar />
            <div>
            <container className="Left_Column">
            <h1 style={{ width: '100%', padding: '10px', paddingBottom: '20px', fontSize: '20px'}}>
              Compare Genes
            </h1>
                <div className="input-container">
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
                    <input type="text" value={gene} onChange={handleInputChange} placeholder="Enter ID" />
                    
                </div>
            <container className="Column_Buttons">
                {/* <button onClick={handleAddId}>Add ID</button> */}
                
                <button className="download" onClick={() => downloadGraph()}>Download</button>
                
                <button className="clear" onClick={() => setSpeciesAndGenes({})}>Clear All</button>
                
                {/* <button className="toggle" onClick={() => HandleCountToggle()}>Toggle</button> */}
                
                <button onClick={() => handleClick()}>Show Selected</button>
             </container>
                <div>
                {gene && (
    <ul className="GeneNamesUl">
        {currSpecGenes
            .filter(id => id.toLowerCase().startsWith(gene.toLowerCase()))
            .filter(id => !(Array.isArray(speciesAndGenes[species]) ? speciesAndGenes[species] : []).includes(id))
            .slice(0, 30)
            .map((id, index) => (
                <li className="GeneNamesLi" key={index} onClick={() => handleSelectSuggestion(id)}>
                    {id}
                </li>
            ))}
    </ul>
)}
                </div>
                
                </container>
                <container className="Graph">
                {showLoader &&
                    <div className="loader"></div>}
                    <svg ref={graph}></svg>
                </container>
                <div id="info-box" ></div>
            </div>
            {isVisible &&
                <div className="checkbox-container">
                    <button className="CloseMenu" onClick={() => handleClick()}>X</button>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="selectedIds">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        {Object.entries(speciesAndGenes).flatMap(([key, values]) =>
                                            values.map((value, index) => (
                                                <Draggable key={`${taxoTranslator[key]} - ${value}`} draggableId={`${taxoTranslator[key]} - ${value}`} index={index}>
                                                    {(provided) => (
                                                        <div 
                                                            ref={provided.innerRef} 
                                                            {...provided.draggableProps} 
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <div>
                                                                <span className="idSpan">{`${taxoTranslator[key]} - ${value}`}</span>
                                                                <button onClick={() => handleRemoveId(`${taxoTranslator[key]} - ${value}`)} className="remove">X</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
            </div>}
        </>
    );
};

export default Filter;