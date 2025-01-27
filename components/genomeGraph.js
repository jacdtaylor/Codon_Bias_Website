import * as d3 from 'd3';
import { useEffect } from 'react';
import codonJSON from "../data/codonJSON.json";
import { toInteger } from 'lodash';



const drawChart = (data, svgRef, order) => {
    // Clear existing svg content
    d3.select(svgRef.current).selectAll("*").remove();

    // Sort data based on the desired order
    const speciesNames = data.map(d => d.Name);
    const codons = Object.keys(data[0]).filter(key => key !== 'Species' && key !== 'ID' && key !== 'Name');
    const squareLength = (speciesNames.length < 10) ? (450/speciesNames.length) : (15);
    const margin = { top: 50, right: 0, bottom: 200, left: 175 };
    const width = codons.length * 10;
    const height = speciesNames.length * squareLength;

    const svg = d3.select(svgRef.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left - 25},${margin.top})`);

    const x = d3.scaleBand()
        .domain(codons)
        .range([0, codons.length * 10])
        .padding(0);

    const y = d3.scaleBand()
        .domain(speciesNames)
        .range([0, speciesNames.length * squareLength])
        .padding(0);

    const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, 1]);


    // const colorScale = d3.scaleOrdinal()
    // .domain(categories)
    // .range(d3.schemeCategory10);

    
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
                //   .style("fill", d => color( (d.value * (toInteger(codonJSON[d.codon].split("|")[1])+1)) / 2))

        // Highlight on hover
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "black").style("stroke-width", 2);
            // Show information
            const infoBox = d3.select("#info-box");
            const yOffset = window.scrollY || document.documentElement.scrollTop;
            infoBox.html(`<p>Species: ${d.species}</p><p>Codon: ${d.codon}</p><p>Amino Acid: ${codonJSON[d.codon].split("|")[0]}</p><p>Value: ${d.value} </p>`);
            // 
            infoBox.style("left", `${event.pageX - 425}px`) // Adjust for padding
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

        svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${width}, 0)`)
        .call(d3.axisRight(y))
        .selectAll(".tick text")
};

export { drawChart };
