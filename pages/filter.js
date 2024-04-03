import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import SectionTitle from "../components/sectionTitle";
import Image from "next/image";
import TempImg from "../public/img/altair_chart.png"
// import { useState } from 'react';
import axios from 'axios'; // Import Axios for making HTTP requests
import MammaliaJSON from "../data/proportions/mammalia_data.json"
// import style from "..css/filter.css"
// import * as d3 from "d3"
// import React from 'react';
// // import TSV from "tsv-loader?module!../data/proportions/GCF_000001405.40"
// export default function Filter() {

// const PY = require("../components/python.js")


//   return (
//     <>
//       <Head>
//         <title>Gene Filter</title>
//       </Head>
//       <Navbar />
//       <div>
//         <h1>Gene Filter</h1>
        
//           <button type="submit">Run Python Script</button>
//           <button type="button" onClick={PY.callPython()}>Load Data</button>
//       <container id="Test"></container>
//       </div>
//       {/* <Image src={TempImg} /> */}
//       <iframe src= "/altair_chart.html" width="600" height="400" frameborder="0"></iframe>
//     </>
//   );
// }
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import mammaliaData from '../data/proportions/mammalia_data.json';

const Filter = () => {
    const svgRef = useRef();
    const [filteredData, setFilteredData] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [newId, setNewId] = useState('');

    useEffect(() => {
        setFilteredData(mammaliaData);
    }, []);

    const handleAddId = () => {
        if (newId && !selectedIds.includes(newId)) {
            setSelectedIds([...selectedIds, newId]);
            setNewId('');
        }
    };

    const handleRemoveId = (idToRemove) => {
        const updatedIds = selectedIds.filter(id => id !== idToRemove);
        setSelectedIds(updatedIds);
    };

    const handleFilter = () => {
        const filtered = filteredData.filter(item => selectedIds.includes(item.ID) || true);
        if (filtered.length > 0) {
            drawChart(filtered);
        } else {
            console.warn('No data found for the selected IDs');
            // Clear existing svg content if no data found
            d3.select(svgRef.current).selectAll("*").remove();
        }
    };

    const drawChart = (data) => {
      // Clear existing svg content
      d3.select(svgRef.current).selectAll("*").remove();
  
      const speciesNames = data.map(d => d.Name);
      const codons = Object.keys(data[0]).filter(key => key !== 'Species' && key !== 'ID' && key !== 'Name');
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
          .data(d => codons.map(codon => ({ species: d.Name, codon, value: d[codon] })))
          .enter().append("rect")
          .attr("x", d => x(d.codon))
          .attr("y", d => y(d.species))
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
          .style("fill", d => color(d.value))
          // Highlight on hover
          .on("mouseover", function(event, d) {
              d3.select(this).style("stroke", "black").style("stroke-width", 2);
              // Show information
              const infoBox = d3.select("#info-box");
              const yOffset = window.scrollY || document.documentElement.scrollTop;
              infoBox.html(`<p>Codon: ${d.codon}</p><p>Species: ${d.species}</p><p>Value: ${d.value} </p>`);
              infoBox.style("left", `${event.pageX - window.scrollX}px`) // Adjust for padding
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
        <Navbar />
      </Head>
        <div>
            <div class="input-container">
                <input type="text" value={newId} onChange={handleInputChange} placeholder="Enter ID" />
                <button onClick={handleAddId}>Add ID</button>
            </div>
            <div class="IDS">
                {selectedIds.map(id => (
                    <div key={id}>
                        <span>{id}</span>
                        <button onClick={() => handleRemoveId(id)} class="remove">Remove</button>
                    </div>
                ))}
            </div>
            <button onClick={handleFilter} class="filter">Filter</button>
        <container class="Graph">
            <svg ref={svgRef}></svg>
        </container>
            <div id="info-box" ></div>
        </div>
        </>
    );
};

export default Filter;

    
