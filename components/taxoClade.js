import React, { useState, useEffect } from 'react';

/**
 * Retrieves the taxonomic clade (scientific name) for a given NCBI taxon ID.
 * @param {number|string} taxid - The NCBI taxon ID (e.g., 40674)
 * @returns {Promise<string|null>} - The scientific name (e.g., "Mammalia") or null if not found.
 */

// A simple in-memory cache object:
const taxonCache = {};

async function getTaxonomicClade(taxid) {
  if (taxonCache[taxid]) {
    console.log(`Returning cached clade for taxid ${taxid}`);
    return taxonCache[taxid];
  }
  
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=${taxid}&retmode=json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`);
    }
    
    const data = await response.json();
    let clade = null;
    if (data.result && data.result.uids && data.result.uids.length > 0) {
      const uid = data.result.uids[0];
      clade = data.result[uid].scientificname;
    } else if (data.result && data.result[taxid]) {
      clade = data.result[taxid].scientificname;
    }
    
    // Cache the result for later use.
    if (clade) {
      taxonCache[taxid] = clade;
    }
    return clade;
    
  } catch (error) {
    console.error("Error retrieving taxonomic clade:", error);
    return null;
  }
}

/**
 * Extracts the numeric taxon ID from a code string by matching digits after the "@".
 * For example, if the code is "100535@9357", it returns "9357".
 * @param {string} code - The code string.
 * @returns {string|null} - The extracted taxon ID or null if not found.
 */
function extractTaxId(code) {
  if (typeof code !== 'string') {
    console.warn("extractTaxId: Expected a string but got:", code);
    return null;
  }

  const match = code.split("at")[1];
  console.log(match)
  return match 
}

/**
 * A component that uses the extracted taxon ID from a code string to fetch and display the taxonomic clade.
 */
const TaxoClade = ({ code }) => {
  const [clade, setClade] = useState("Loading...");

  useEffect(() => {
    console.log("TaxoClade component mounted/updated with code:", code);
    const taxid = extractTaxId(code);
    console.log("Extracted taxid:", taxid);
    
    if (!taxid) {
      setClade("Invalid code");
      return;
    }
    
    getTaxonomicClade(taxid)
      .then(result => {
        if (result) {
          setClade(result);
        } else {
          setClade("Not Found");
        }
      })
      .catch(error => {
        console.error("Error in TaxoClade component:", error);
        setClade("Error");
      });
  }, [code]);

  return <>{clade}</>;
};

export default TaxoClade;
