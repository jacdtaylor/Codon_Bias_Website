import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import Head from "next/head";
import { ClusterCodonData } from "../components/cluster.js";
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import allSpeciesData from "../data/speciesList.json"

const compareOrtho = () => {

    const svgRef = useRef();
    const [species, setSpecies] = useState("")
    const [selectedGenes, setSelectedGenes] = useState([])
    const [proportionData, setProportionData] = useState([])
    const [allSpecies, setAllSpecies] = useState([])
    const [currentSpeciesData, setCurrentSpeciesData] = useState({})

    useEffect(()=>{
        setAllSpecies(allSpeciesData);
    }, []);


    

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



    const handleSpeciesChange = (e) => {
        const selected = e.target.species;
        setSpecies(selected);
        console.log()
        handleDataChange(selected);
    }


    const handleDataChange = (item) => {
        console.log(`speciesIndividualJSONS/${item}JSON.json`)
        fetch(`speciesIndividualJSONS/${item}JSON.json`).then(response => {
            if (!response.ok) {throw new Error("Species Error");}
            return response.json();

        })
        .then(data=>{
            setCurrentSpeciesData(data);
            console.log(data)
        })
    }


    

    return (
        <>
        <link rel="stylesheet" href="filter.css"></link>
            <Head>
            </Head>
            <Navbar />  
            <select
            className="px-4 py-3 text-lg font-medium text-center text-gray-500 rounded-md"
            onChange={handleSpeciesChange}
            value={species}
          >
            <option disabled value="">
              -- Select Species --
            </option>
            {allSpecies
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        </>
    );
}
export default compareOrtho;