import * as d3 from 'd3';
import codonJSON from "../data/codonJSON.json";
import sortedNameList from "../data/sortedNameList.json";
import expected from "../data/expectedProportions.json";

const drawChart = (data, svgCurrent, taxoKey) => {
  // Clear existing svg content and remove any previously created fixed x-axis svgs
  d3.select(svgCurrent.current).selectAll("*").remove();
  d3.select(svgCurrent.current.parentNode)
    .selectAll("svg.x-axis-svg")
    .remove();

  data.sort((a, b) => a.Gene.localeCompare(b.Gene));

  // Create species names as before
  const speciesNames = data.map(d => `${taxoKey[d.Species]} - ${d.Gene}`);

  // Group and sort codons by amino acid, e.g. by the number of synonymous codons:
  const allCodonKeys = Object.keys(codonJSON);
  const codonsByAA = d3.group(allCodonKeys, codon => codonJSON[codon].split("|")[0]);
  // Sort amino acids by number of synonymous codons (ascending order, for example)
  const sortedAminoAcids = Array.from(codonsByAA.keys())
    .sort((aa1, aa2) => codonsByAA.get(aa1).length - codonsByAA.get(aa2).length);
  // Flatten the groups in the new sorted order
  const sortedCodons = [];
  sortedAminoAcids.forEach(aa => {
    // Optionally, sort the codons within each group if desired.
    sortedCodons.push(...codonsByAA.get(aa));
  });

  // Compute custom x positions with gaps between amino acid groups
  const codonWidth = 10;  // width for each codon rectangle
  const gapWidth = 1;     // width for the gap between amino acid groups
  const gapPositions = []; // store x positions and widths for gaps

  const xPositions = {};  // computed x position for each codon
  let currentX = 0;
  for (let i = 0; i < sortedCodons.length; i++) {
    if (i > 0) {
      const currentAA = codonJSON[sortedCodons[i]].split("|")[0];
      const previousAA = codonJSON[sortedCodons[i - 1]].split("|")[0];
      if (currentAA !== previousAA) {
        // Record the gap: we want to draw a colored rectangle here
        gapPositions.push({ x: currentX, width: gapWidth });
        currentX += gapWidth;
      }
    }
    xPositions[sortedCodons[i]] = currentX;
    currentX += codonWidth;
  }
  const totalWidth = currentX;

  // Other pre-calculations remain the same
  const squareLength = (speciesNames.length < 10) ? (450 / speciesNames.length) : 15;
  const margin = { top: 50, right: 500, bottom: 200, left: 50 };
  const height = speciesNames.length * squareLength;

  // Create the main svg container for the heatmap and y-axis.
  // Note: We append a <g> to the main SVG and shift it by the margins.
  const svg = d3.select(svgCurrent.current)
    .attr("width", totalWidth + margin.left + margin.right + 50)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left + 50},${margin.top})`);

  // ***********************************************
  // Draw the gap rectangles with your custom color
  // ***********************************************
  const gapColor = "#161720"; // Set this to your desired gap color
  gapPositions.forEach(gap => {
    svg.append("rect")
      .attr("x", gap.x)
      .attr("y", 0)
      .attr("width", gap.width)
      .attr("height", height)
      .style("fill", gapColor);
  });

  // Create the y-scale for rows
  const y = d3.scaleBand()
    .domain(speciesNames)
    .range([0, height])
    .padding(0);

  // Create a diverging color scale for the heatmap cells
  const minDeviation = -1; // Adjust based on expected range
  const maxDeviation = 1;  // Adjust based on expected range
  const color = d3.scaleDiverging()
    .domain([maxDeviation, 0, minDeviation])
    .interpolator(d3.interpolateRdYlBu);

  // ***********************************************
  // Draw the heatmap cells on top of the gap rectangles
  // ***********************************************
  svg.selectAll("g.cellGroup")
    .data(data)
    .enter().append("g")
    .attr("class", "cellGroup")
    .selectAll("rect.cell")
    .data(d => sortedCodons.map(codon => ({
      Species: d.Species,
      Gene: d.Gene,
      codon,
      value: +d[codon].split("|")[0],       // numeric value
      count: d[codon].split("|")[1],
      expectedValue: expected[codon] || 0
    })))
    .enter().append("rect")
    .attr("class", "cell")
    .attr("x", d => xPositions[d.codon])
    .attr("y", d => y(`${taxoKey[d.Species]} - ${d.Gene}`))
    .attr("width", codonWidth)
    .attr("height", y.bandwidth())
    .style("fill", d => color((d.value - d.expectedValue) / d.expectedValue))
    .on("mouseover", function(event, d) {
      d3.select(this).style("stroke", "black").style("stroke-width", 2);
      const infoBox = d3.select("#info-box");
      const yOffset = window.scrollY || document.documentElement.scrollTop;
      infoBox.html(`<p>Species: ${taxoKey[d.Species]}</p>
                    <p>Gene: ${d.Gene}</p>
                    <p>Codon: ${d.codon}</p>
                    <p>Amino Acid: ${codonJSON[d.codon].split("|")[0]}</p>
                    <p>Proportion: ${d.value}</p>
                    <p>Count: ${d.value == 0 ? 0 : d.count}</p>`)
        .style("left", `${event.pageX - 415}px`)
        .style("top", `${event.pageY - yOffset}px`)
        .style("max-width", "400px")
        .style("visibility", "visible");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).style("stroke", "none");
      d3.select("#info-box").style("visibility", "hidden");
    });

  // ***********************************************
  // Draw the y-axis (as before)
  // ***********************************************
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${totalWidth}, 0)`)
    .call(d3.axisRight(y))
    .selectAll("text")
    .style("text-anchor", "start")
    .attr("dx", ".8em")
    .attr("dy", ".15em")
    .on("mouseover", function(event, d) {
      d3.select(this).style("stroke", "white").style("stroke-width", 0.5);
    })
    .on("mouseout", function(event, d) {
      d3.select(this).style("stroke", "none");
      d3.select("#info-box").style("visibility", "hidden");
    });

  // ***********************************************
  // Create the first fixed x-axis (attached to the screen)
  // ***********************************************
  const xAxisHeight = 100;  // Height for the first fixed x-axis area
  const xAxisSvg = d3.select(svgCurrent.current.parentNode)
    .append("svg")
    .attr("class", "x-axis-svg")
    .attr("width", totalWidth + margin.left + margin.right + 50)
    .attr("height", xAxisHeight)
    .style("position", "fixed")
    .style("bottom", "0px")
    .style("left", (margin.left + 50) + "px")
    .style("background-color", gapColor);

  const xScaleForAxis = d3.scaleOrdinal()
    .domain(sortedCodons)
    .range(sortedCodons.map(codon => xPositions[codon]));

  const xAxis = d3.axisBottom(xScaleForAxis)
    .tickValues(sortedCodons);

  xAxisSvg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(338,0)`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  // ***********************************************
  // Create the second x-axis (attached to the bottom of the graph)
  // ***********************************************
  // This axis is appended to the main SVG container (inside the <g> we created earlier)
  // so that it always remains at the bottom edge of your heatmap.
  const graphXAxis = d3.axisBottom(xScaleForAxis)
    .tickValues(sortedCodons)
    // You can change the tick format if desired:
    .tickFormat(d => d);

  svg.append("g")
    .attr("class", "graph-bottom-axis")
    // Position it at y = height so that it aligns with the bottom of the heatmap:
    .attr("transform", `translate(0, ${height})`)
    .call(graphXAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");
};

export { drawChart };
