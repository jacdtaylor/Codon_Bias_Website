import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import humanData from '../data/proportions/humanCodon.json';
import Navbar from "../components/navbar";
import Head from "next/head";
import codonJSON from "../data/codonJSON.json";



const Filter = () => {
    const svgRef = useRef();
    const [filteredData, setFilteredData] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [newId, setNewId] = useState('');


    useEffect(() => {
        setFilteredData(humanData);
    }, []);

    useEffect(() => {
        handleFilter();
    }, [selectedIds]); // Trigger handleFilter whenever selectedIds change

    const handleAddId = () => {
        if (newId && !selectedIds.includes(newId)) {
            setSelectedIds(prevIds => {
                const updatedIds = [...prevIds, newId];
                setNewId(''); // Reset newId after updating selectedIds
                return updatedIds;
            });
        }
    };

    const handleRemoveId = (idToRemove) => {
        setSelectedIds(prevIds => prevIds.filter(id => id !== idToRemove));
    };

    const handleFilter = () => {
        const filtered = filteredData.filter(item => selectedIds.includes(item.Gene));
        console.log(filtered);
        if (filtered.length > 0) {
            drawChart(filtered, selectedIds);
        } else {
            console.warn('No data found for the selected IDs');
            // Clear existing svg content if no data found
            d3.select(svgRef.current).selectAll("*").remove();
        }
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
          .attr("y", d => y(d.Gene))
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
        // .attr("height", d => (y.bandwidth() / d.totalCount) * parseInt(d.count) *10) // Adjust height proportionally
          .style("fill", d => color(d.value))
          // Highlight on hover
          .on("mouseover", function(event, d) {
              d3.select(this).style("stroke", "black").style("stroke-width", 2);
              // Show information
              const infoBox = d3.select("#info-box");
              const yOffset = window.scrollY || document.documentElement.scrollTop;
              const codon = d.codon;
       
              
              infoBox.html(`<p>Codon: ${codon}</p><p>Gene: ${d.Gene}</p><p>Proportion: ${d.value} </p><p>Count: ${d.count}</p><p>Amino Acid: ${codonJSON[codon]}</p>`);
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
      </Head>
        <Navbar />
      
            
        <div>
            <div className="input-container">
                <input type="text" value={newId} onChange={handleInputChange} placeholder="Enter ID" />
                <button onClick={handleAddId}>Add ID</button>
            </div>
            <div className="checkbox-container">
                <div className = "IDS">
                {selectedIds.map(id => (
                    <div key={id}>
                        <span>{id}</span>
                        <button onClick={() => handleRemoveId(id)} class="remove">Remove</button>
                    </div>
                ))}
            </div></div>
            <button onClick={handleFilter} class="filter">Filter</button>
        <container className="Graph">
            <svg ref={svgRef}></svg>
        </container>
            <div id="info-box" ></div>
        </div>
        </>
    );
};

export default Filter;

    
