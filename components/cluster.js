import codonJSON from "../data/codonJSON.json";




// const ClusterCodonData = (Data) => {
//     const NewOrder = {};
//     let BiasCode = "";
//     let prev = "";
//     let prevVal = -1;
//     let CurrentHigh = 0;
//     let Count = 0;

//     for (let obj in Data) {
//         for (let codon in codonJSON)    {
//             if (prev === codonJSON[codon]) {
//                 Count+=1;
//                 if (Data[obj][codon].split("|")[0] > prevVal) {
//                     CurrentHigh = Count;
//                     prevVal = Data[obj][codon].split("|")[0];
//                 } 
//             }
//             else {
                
//                 if (prev==="") {
//                     CurrentHigh = 1
//                     Count=1;
//                     prev = codonJSON[codon];
//                     prevVal = Data[obj][codon].split("|")[0];
//                 }
//                 else {
//                     BiasCode+=String(CurrentHigh);
//                     Count=0;
//                     prev = codonJSON[codon];
//                     prevVal = Data[obj][codon].split("|")[0];
//                     CurrentHigh = 0;
//                 }
                
//             }
            
            
//         }
//         NewOrder[Data[obj]["Gene"]] = BiasCode;
//         BiasCode="";
//     }
//     const entries = Object.entries(NewOrder);
//     entries.sort((a,b)=>a[1].localeCompare(b[1]));
//     const sortedKeys = entries.map(entry => entry[0]);
//     console.log(sortedKeys);
//     return(sortedKeys)
// }


function compareGenes(geneCodonData, gene1, gene2) {
    const data1 = geneCodonData[gene1];
    const data2 = geneCodonData[gene2];
    


    if (!data1 || !data2) {
        throw new Error('Gene not found in codon data');
    }

    let count = 0;

    Object.keys(data1).forEach(key => {
        const prop1 = parseFloat(data1[key].split('|')[0]);
        const prop2 = parseFloat(data2[key].split('|')[0]);

        if (!isNaN(prop1) && !isNaN(prop2) && prop1 > prop2) {
            count++;
        }
    });

    return count;
}


function returnGeneLength(geneCodonData, gene1) {
    const data1 = geneCodonData[gene1];


    let count = 0;

    Object.keys(data1).forEach(key => {
        const prop1 = parseFloat(data1[key].split('|')[1]);
        count+=prop1;
})

    return count;
}


const ClusterCodonData = (Data) => {
    const geneCodonData = Data.reduce((acc, { Gene, ID, ...rest }) => {
        acc[Gene] = rest;
        return acc;
    }, {});

    const OrderedArray = [];

    for (let gene in geneCodonData) {
        if (OrderedArray.length === 0) {OrderedArray.push(gene)}
        else {
            for (let item in OrderedArray) {
                let diff = compareGenes(geneCodonData, gene, OrderedArray[item]);
                if (diff < 32) {OrderedArray.splice(item, 0, gene);
                break;}
            }
            if (!OrderedArray.includes(gene)) {OrderedArray.push(gene);}}}
            // if (returnGeneLength(geneCodonData,gene) < returnGeneLength(geneCodonData,OrderedArray[item])) {
            //     OrderedArray.splice(item,0,gene);
            //     break;
            // }
            // if (!OrderedArray.includes(gene)) {OrderedArray.push(gene);}}}}


return(OrderedArray);

        }

export { ClusterCodonData };


// TRY SORTING BY GENE LENGTH