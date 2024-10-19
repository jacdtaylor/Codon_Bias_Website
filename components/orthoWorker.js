// orthoWorker.js

// Define the message handler for the worker
self.onmessage = async (event) => {
    const { id, groupDivides, codonOrder } = event.data;

    try {
        // Determine the group file based on the id and groupDivides
        let i = 0;
        while (i < groupDivides.length) {
            if (id < groupDivides[i]) {
                break;
            }
            i++;
        }

        // Fetch the group file data
        const response = await fetch(`OrthoGroups/GroupFile_${i}.json`);
        if (!response.ok) {
            throw new Error("Failed to fetch group data");
        }
        const groupData = await response.json();

        // Get the ortholog data based on the ID
        const orthoDataArray = groupData[id];

        // Fetch and process the ortholog data
        const oData = [];
        const fetchPromises = orthoDataArray.map(async ([species, gene]) => {
            try {
                const speciesResponse = await fetch(`speciesIndividualJSONS/${species}JSON.json`);
                if (!speciesResponse.ok) {
                    throw new Error("Failed to fetch species data");
                }
                const speciesData = await speciesResponse.json();
                const proportionData = speciesData[gene][1];

                // Structure the data as needed
                const AddedData = codonOrder.reduce((acc, key, index) => {
                    acc[key] = proportionData[index];
                    return acc;
                }, {});
                AddedData["Species"] = species;
                AddedData["Gene"] = gene;

                oData.push(AddedData);
            } catch (error) {
                console.error("Error fetching data for", species, gene, error);
            }
        });

        // Wait for all data to be fetched
        await Promise.all(fetchPromises);

        // Send the processed data back to the main thread
        postMessage(oData);
    } catch (error) {
        postMessage({ error: error.message });
    }
};
