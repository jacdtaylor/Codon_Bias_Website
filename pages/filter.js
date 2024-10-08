import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import humanData from '../data/proportions/humanCodon.json';
import Navbar from "../components/navbar";
import Head from "next/head";
import { ClusterCodonData } from "../components/cluster.js";
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { drawChart } from '../components/humanHeatMap.js';
import VertebrateJSON from '../data/proportions/vertebrateExampleJSON.json'





const Filter = () => {
    const svgRef = useRef();
    const [filteredData, setFilteredData] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [newId, setNewId] = useState('');
    const [allIds, setAllIds] = useState([])
    const [isVisible, setIsVisible] = useState(false);
    const [countToggle, setCountToggle] = useState(false);


    useEffect(() => {
        setFilteredData(humanData);
        // setFilteredData([...VertebrateJSON, ...humanData]);

    }, []);

    useEffect(() => {getAllGenes(humanData);}
    // useEffect(() => {getAllGenes([...VertebrateJSON, ...humanData]);}

        , []);

    useEffect(() => {
        handleFilter();
    }, [selectedIds, countToggle]); // Trigger handleFilter whenever selectedIds change

    const handleAddId = () => {
        if (allIds.includes(newId) | newId.includes(",")) {
            const idsToAdd = newId.split(',').map(id => id.trim());
            setSelectedIds(prevIds => {
                const updatedIds = [...new Set([...prevIds, ...idsToAdd])]; // Using Set to ensure unique values
                setNewId(''); // Reset newId after updating selectedIds
                return updatedIds;
            });
        }
        else {
            alert("Gene Name Not Found.")
        }
    };

    const getAllGenes = (data) => {
        const valueArray = [];
        for (const Target of data) {
            valueArray.push(Target["Gene"]);
        }
      setAllIds(valueArray) 
    };

    const HandleCountToggle = () => {
        setCountToggle(!countToggle);
    }
    const handleRemoveId = (idToRemove) => {
        setSelectedIds(prevIds => prevIds.filter(id => id !== idToRemove));
    };

    const handleSelectSuggestion = (suggestion) => {
        setSelectedIds(prevIds => [...new Set([...prevIds, suggestion])]); // Add the suggestion to selectedIds
    };

    const handleClick = () => {
        setIsVisible(!isVisible);
      };

    const downloadGraph = () => {
        // Select the SVG element
        const svgElement = svgRef.current;
    
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
    
    
    const handleFilter = () => {
        const filtered = filteredData.filter(item => {
            const geneUpperCase = item.Gene.toUpperCase();
            const selectedIdsLowerCase = selectedIds.map(id => id.toUpperCase());
            return selectedIdsLowerCase.includes(geneUpperCase);
        });
        console.log(filtered);
        if (filtered.length > 0) {
            drawChart(filtered, selectedIds, svgRef, countToggle);
        } else {
            console.warn('No data found for the selected IDs');
            // Clear existing svg content if no data found
            d3.select(svgRef.current).selectAll("*").remove();
        }
    };
    
    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        const newSelectedIds = Array.from(selectedIds);
        const [reorderedItem] = newSelectedIds.splice(result.source.index, 1);
        newSelectedIds.splice(result.destination.index, 0, reorderedItem);

        setSelectedIds(newSelectedIds);
    };
    
    

    const handleInputChange = (e) => {
        setNewId(e.target.value);
    };

    const HandleCluster = () => {
        const filtered = filteredData.filter(item => {
            const geneUpperCase = item.Gene.toUpperCase();
            const selectedIdsLowerCase = selectedIds.map(id => id.toUpperCase());
            return selectedIdsLowerCase.includes(geneUpperCase);
        });
        setSelectedIds(ClusterCodonData(filtered));
        
        
    }

    return (
        <>
            <link rel="stylesheet" href="filter.css"></link>
            <Head>
            </Head>
            <Navbar />
            <div>
            <container className="Left_Column">
                <div className="input-container">
                    <input type="text" value={newId} onChange={handleInputChange} placeholder="Enter ID" />
                    
                </div>
            <container className="Column_Buttons">
                <button onClick={handleAddId}>Add ID</button>
                <br />
                <button className="download" onClick={() => downloadGraph()}>Download</button>
                <br />
                <button className="clear" onClick={() => setSelectedIds([])}>Clear All</button>
                <br />
                <button className="toggle" onClick={() => HandleCountToggle()}>Toggle</button>
                <br />
                <button className="Cluster" onClick={() => HandleCluster()}>Cluster</button>
                <br />
                {!isVisible && (<button onClick={() => handleClick()}>Show Selected Genes</button>)}
             </container>
                <div>
                {newId && (
    <ul className="GeneNamesUl">
        {allIds
            .filter(id => id.toLowerCase().startsWith(newId.toLowerCase()))
            .filter(id => !selectedIds.includes(id))
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
                <container className="G_container">
                <container className="Graph">
                    <svg ref={svgRef}></svg>
                </container>
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
                                {selectedIds.map((id, index) => (
                                    <Draggable key={id} draggableId={id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                <div>
                                                    <span className="idSpan">{id}</span>
                                                    <button onClick={() => handleRemoveId(id)} className="remove">X</button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
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