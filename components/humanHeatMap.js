import * as d3 from 'd3';
import codonJSON from "../data/codonJSON.json";






const drawChart = (data, order, svgCurrent, countToggle) => {
    // Clear existing svg content
    d3.select(svgCurrent.current).selectAll("*").remove();
    data.sort((a, b) => order.indexOf(a.Gene) - order.indexOf(b.Gene));

    
    const speciesNames = data.map(d => d.Gene);
    const codons = Object.keys(codonJSON);
    const totalCodonCounts = data.map(d => ({
      Gene: d.Gene,
      totalCount: codons.reduce((acc, codon) => acc + parseInt(d[codon].split("|")[1]), 0)
  }));
    const squareLength = (speciesNames.length < 10) ? (450/speciesNames.length) : (15);
    const margin = { top: 50, right: 75, bottom: 200, left: 175 };
    const width = codons.length*10;
    const height = speciesNames.length*squareLength;

    const svg = d3.select(svgCurrent.current)
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
          totalCount: totalCodonCounts.find(tc => tc.Gene === d.Gene).totalCount})))
        .enter().append("rect")
        .attr("x", d => x(d.codon))
        .attr("y", d => countToggle ? y(d.Gene) + (y.bandwidth() - ((y.bandwidth() / d.totalCount) * parseInt(d.count) * 10)) / 2 : y(d.Gene))
        .attr("width", x.bandwidth())
        .attr("height", d => countToggle ? Math.max((y.bandwidth() / d.totalCount) * parseInt(d.count) * 10, 3) : 
        y.bandwidth())


        // Adjust Coloring for Expected Proportion
      //   .style("fill", d => color( (d.value * (toInteger(codonJSON[d.codon].split("|")[1])+1)) / 2))


        .style("fill", d => color( (d.value ))) // Default Coloring

        // Highlight on hover
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "black").style("stroke-width", 2);
            // Show information
            const infoBox = d3.select("#info-box");
            const yOffset = window.scrollY || document.documentElement.scrollTop;
            const codon = d.codon;
     
            
            infoBox.html(`<p>Gene: ${d.Gene}</p><p>Codon: ${codon}</p><p>Amino Acid: ${codonJSON[codon]}</p><p>Proportion: ${d.value} </p><p>Count: ${d.count}</p>`);
          //   <p>${ -1 * (toInteger(codonJSON[d.codon].split("|")[1])) * (expectedProportions[d.codon] - d.value )}</p>

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


export { drawChart };