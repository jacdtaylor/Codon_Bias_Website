import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import humanData from '../data/proportions/humanCodon.json';
import Navbar from "../components/navbar";
import Head from "next/head";
import codonJSON from "../data/codonJSON.json";
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';





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
    }, []);

    useEffect(() => {getAllGenes(humanData);}
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
            drawChart(filtered, selectedIds);
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
    
    const drawChart = (data, order) => {
      // Clear existing svg content
      d3.select(svgRef.current).selectAll("*").remove();
      data.sort((a, b) => order.indexOf(a.Gene) - order.indexOf(b.Gene));

      
      const speciesNames = data.map(d => d.Gene);
      const codons = Object.keys(data[0]).filter(key => key !== 'Gene' && key !== 'ID');
      const totalCodonCounts = data.map(d => ({
        Gene: d.Gene,
        totalCount: codons.reduce((acc, codon) => acc + parseInt(d[codon].split("|")[1]), 0)
    }));
      const squareLength = (speciesNames.length < 10) ? (450/speciesNames.length) : (15);
      const margin = { top: 50, right: 75, bottom: 200, left: 175 };
      const width = codons.length*10;
      const height = speciesNames.length*squareLength;
  
      const svg = d3.select(svgRef.current)
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left + 50},${margin.top})`);
  
      const x = d3.scaleBand()
          .domain(codons)
          .range([0, codons.length * 10])
          .padding(0);
    
    
      const y = d3.scaleBand()
          .domain(speciesNames)
          .range([0, speciesNames.length * squareLength])
          .padding(0);

  
      const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, 1]);

      
  
      // Add rectangles for heatmap
      
      svg.selectAll("rect")
          .data(data)
          .enter().append("g")
          .selectAll("rect")
          .data(d => codons.map(codon => 
            ({ Gene: d.Gene, codon, value: d[codon].split("|")[0], count: d[codon].split("|")[1],
            totalCount: totalCodonCounts.find(tc => tc.Gene === d.Gene).totalCount })))
          .enter().append("rect")
          .attr("x", d => x(d.codon))
          .attr("y", d => countToggle ? y(d.Gene) + (y.bandwidth() - ((y.bandwidth() / d.totalCount) * parseInt(d.count) * 10)) / 2 : y(d.Gene))
          .attr("width", x.bandwidth())
          .attr("height", d => countToggle ? Math.max((y.bandwidth() / d.totalCount) * parseInt(d.count) * 10, 3) : 
          y.bandwidth())
        // .attr("height", d => (y.bandwidth() / d.totalCount) * parseInt(d.count) *10) // Adjust height proportionally
          .style("fill", d => color(d.value))
          // Highlight on hover
          .on("mouseover", function(event, d) {
              d3.select(this).style("stroke", "black").style("stroke-width", 2);
              // Show information
              const infoBox = d3.select("#info-box");
              const yOffset = window.scrollY || document.documentElement.scrollTop;
              const codon = d.codon;
       
              
              infoBox.html(`<p>Gene: ${d.Gene}</p><p>Codon: ${codon}</p><p>Amino Acid: ${codonJSON[codon]}</p><p>Proportion: ${d.value} </p><p>Count: ${d.count}</p>`);
              infoBox.style("left", `${event.pageX - 415}px`) // Adjust for padding
                  .style("top", `${event.pageY - yOffset}px`)
                  .style("max-width", "400px")
                  .style("visibility", "visible");
                  
          })
          .on("mouseout", function(event, d) {
              d3.select(this).style("stroke", "none");
              // Hide information
              d3.select("#info-box").style("visibility", "hidden");
          });
  
      // Add x-axis
      svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")") // Move the axis to the bottom
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");
  
      // Add y-axis
      svg.append("g")
          .attr("class", "axis")
          .call(d3.axisLeft(y));
  };
  

    const handleInputChange = (e) => {
        setNewId(e.target.value);
    };

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
                
                <container className="Graph">
                    <svg ref={svgRef}></svg>
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