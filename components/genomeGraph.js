import * as d3 from 'd3';
import codonJSON from "../data/codonJSON.json";
import sortedNameList from "../data/sortedNameList.json";
import expected from "../data/expectedProportions.json";
import classTranslator from "../data/classTranslator.json"

const drawChart = (data, svgCurrent, taxoKey) => {
  d3.select(svgCurrent.current).selectAll("*").remove();
  d3.select(svgCurrent.current.parentNode)
    .selectAll("svg.x-axis-svg")
    .remove();

  const speciesNames = data.map(d => d.Species.replace(".", "_"));
  
  // Map species names to species IDs
  const speciesIDMap = speciesNames.map(species => taxoKey[species] || species);  // If no mapping exists, keep the species name
  
  const allCodonKeys = Object.keys(codonJSON);
  const codonsByAA = d3.group(allCodonKeys, codon => codonJSON[codon].split("|")[0]);
  const sortedAminoAcids = Array.from(codonsByAA.keys())
    .sort((aa1, aa2) => codonsByAA.get(aa1).length - codonsByAA.get(aa2).length);
  const sortedCodons = [];
  sortedAminoAcids.forEach(aa => {
    sortedCodons.push(...codonsByAA.get(aa));
  });

  const codonWidth = 10;
  const gapWidth = 1;
  const gapPositions = [];
  const xPositions = {};
  let currentX = 0;
  for (let i = 0; i < sortedCodons.length; i++) {
    if (i > 0) {
      const currentAA = codonJSON[sortedCodons[i]].split("|")[0];
      const previousAA = codonJSON[sortedCodons[i - 1]].split("|")[0];
      if (currentAA !== previousAA) {
        gapPositions.push({ x: currentX, width: gapWidth });
        currentX += gapWidth;
      }
    }
    xPositions[sortedCodons[i]] = currentX;
    currentX += codonWidth;
  }
  const totalWidth = currentX;

  const squareLength = (speciesNames.length < 10) ? (450 / speciesNames.length) : 15;
  const margin = { top: 50, right: 500, bottom: 200, left: 50 };
  const height = speciesNames.length * squareLength;

  const svg = d3.select(svgCurrent.current)
    .attr("width", totalWidth + margin.left + margin.right + 50)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left + 50},${margin.top})`);

  const gapColor = "#161720";
  gapPositions.forEach(gap => {
    svg.append("rect")
      .attr("x", gap.x)
      .attr("y", 0)
      .attr("width", gap.width)
      .attr("height", height)
      .style("fill", gapColor);
  });

  // Update y scale to use species ID instead of species name
  const y = d3.scaleBand()
    .domain(speciesIDMap)  // Use species IDs from taxoKey
    .range([0, height])
    .padding(0);

  const minDeviation = -1;
  const maxDeviation = 1;
  const color = d3.scaleDiverging()
    .domain([maxDeviation, 0, minDeviation])
    .interpolator(d3.interpolateRdYlBu);

  svg.selectAll("g.cellGroup")
    .data(data)
    .enter().append("g")
    .attr("class", "cellGroup")
    .selectAll("rect.cell")
    .data(d => sortedCodons.map(codon => ({
      Species: d.Species.replace(".", "_"),
      codon,
      value: +d[codon].split("|")[0],
      count: d[codon].split("|")[1],
      expectedValue: expected[codon] || 0
    })))
    .enter().append("rect")
    .attr("class", "cell")
    .attr("x", d => xPositions[d.codon])
    .attr("y", d => y(taxoKey[d.Species.replace(".", "_")]))  // Use species ID for y-positioning
    .attr("width", codonWidth)
    .attr("height", y.bandwidth())
    .style("fill", d => color((d.value - d.expectedValue) / d.expectedValue))
    .on("mouseover", function(event, d) {
      d3.select(this).style("stroke", "black").style("stroke-width", 2);
      const infoBox = d3.select("#info-box");
      const yOffset = window.scrollY || document.documentElement.scrollTop;
      infoBox.html(`<p>Species: ${taxoKey[d.Species.replace(".", "_")]}</p>
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

  const xAxisHeight = 100;

  const xScaleForAxis = d3.scaleOrdinal()
    .domain(sortedCodons)
    .range(sortedCodons.map(codon => xPositions[codon]));

  const xAxis = d3.axisBottom(xScaleForAxis)
    .tickValues(sortedCodons);

  const graphXAxis = d3.axisBottom(xScaleForAxis)
    .tickValues(sortedCodons)
    .tickFormat(d => d);

  svg.append("g")
    .attr("class", "graph-bottom-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(graphXAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${totalWidth}, 0)`)
    .call(d3.axisRight(y))
    .selectAll("text")
    .style("text-anchor", "start")
    .attr("dx", ".8em")
    .attr("dy", ".15em");

  const classColorScale = d3.scaleOrdinal(d3.schemeCategory10);

  svg.selectAll("rect.class-bar")
  .data(speciesNames)
  .enter().append("rect")
  .attr("class", "class-bar")
    .style("fill", d => classColorScale(classTranslator[d] || "default")) // Use species ID to fetch class color

  .attr("x", -15) // Position to the left
  .attr("y", d => y(taxoKey[d.replace(".", "_")])) // Use species ID for vertical positioning
  .attr("width", 15) // Width of the class color bar
  .attr("height", y.bandwidth()) // Match row height
  .on("mouseover", function(event, d) {
    d3.select(this).style("stroke", "black").style("stroke-width", 2);
    const infoBox = d3.select("#class-box");
    const yOffset = window.scrollY || document.documentElement.scrollTop;
    infoBox.html(`<p>${classTranslator[d]}</p>`)
      .style("left", `${event.pageX - 100}px`)
      .style("top", `${event.pageY - yOffset}px`)
      .style("max-width", "100px")
      .style("visibility", "visible");
  })
  .on("mouseout", function(event, d) {
    d3.select(this).style("stroke", "none");
    d3.select("#class-box").style("visibility", "hidden");
  });

};


export { drawChart };
