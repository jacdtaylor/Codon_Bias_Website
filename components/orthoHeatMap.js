import * as d3 from 'd3';
import codonJSON from "../data/codonJSON.json";
import sortedNameList from "../data/sortedNameList.json"
import expected from "../data/expectedProportions.json"




const drawChart = (data, svgCurrent, taxoKey) => {
    // Clear existing svg content
    d3.select(svgCurrent.current).selectAll("*").remove();
    data.sort((a, b) => a.Gene.localeCompare(b.Gene));


   
    
    const speciesNames = data.map(d => `${taxoKey[d.Species]} - ${d.Gene}`);
    const codons = Object.keys(codonJSON);
    const totalCodonCounts = data.map(d => ({
      Gene: d.Gene,
      totalCount: codons.reduce((acc, codon) => acc + parseInt(d[codon].split("|")[1]), 0)
  }));
    const squareLength = (speciesNames.length < 10) ? (450/speciesNames.length) : (15);
    const margin = { top: 50, right: 500, bottom: 200, left: 50 };
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


        const minDeviation = -1; // Adjust based on expected range
        const maxDeviation = 1;  // Adjust based on expected range
        
        const color = d3.scaleDiverging()
            .domain([maxDeviation, 0, minDeviation]) 
            .interpolator(d3.interpolateRdYlBu); // Red for below expected, blue for above expected
        
        svg.selectAll("rect")
            .data(data)
            .enter().append("g")
            .selectAll("rect")
            .data(d => codons.map(codon => ({
                Species: d.Species,
                Gene: d.Gene,
                codon,
                value: d[codon].split("|")[0],
                count: d[codon].split("|")[1],
                expectedValue: expected[codon] || 0
            })))
            .enter().append("rect")
            .attr("x", d => x(d.codon))
            .attr("y", d => y(`${taxoKey[d.Species]} - ${d.Gene}`))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => color((d.value - d.expectedValue)/(d.expectedValue))) // Now using a diverging scale
        
        // Highlight on hover
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "black").style("stroke-width", 2);
            // Show information
            const infoBox = d3.select("#info-box");
            const yOffset = window.scrollY || document.documentElement.scrollTop;
            const codon = d.codon;
     
            
            infoBox.html(`<p>Species: ${taxoKey[d.Species]}</p><p>Gene: ${d.Gene}</p><p>Codon: ${codon}</p><p>Amino Acid: ${codonJSON[codon].split("|")[0]}</p><p>Proportion: ${d.value} </p><p>Count: ${d.value == 0 ? 0 : d.count}</p>`);
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

    
  svg.append("g")
      
  .attr("class", "axis")
  .attr("transform", `translate(${width}, 0)`)  // Move y-axis to the right by the width of the graph
  .call(d3.axisRight(y))  // Use axisRight to put labels on the right side
  .selectAll("text")
  .style("text-anchor", "start")  // Left align the text (so it aligns with the axis properly on the right side)
  .attr("dx", ".8em")             // Add spacing between the axis and text to prevent overlap
  .attr("dy", ".15em")
  .on("mouseover", function(event, d) {

        d3.select(this).style("stroke", "white").style("stroke-width", 0.5);
                // Show information
                // const infoBox = d3.select("#info-box");
                // const yOffset = window.scrollY || document.documentElement.scrollTop;
               
         
                
                // infoBox.html(d);
                //  infoBox.style("left", `${event.pageX - 415}px`) // Adjust for padding
                //     .style("top", `${event.pageY - yOffset}px`)
                //     .style("max-width", "400px")
                //     .style("visibility", "visible");
      })  
      .on("mouseout", function(event, d) {
        d3.select(this).style("stroke", "none");
        // Hide information
        d3.select("#info-box").style("visibility", "hidden");
    });
    

};


export { drawChart };