import codonJSON from "../data/codonJSON.json";




const ClusterCodonData = (Data) => {
    const NewOrder = {};
    let BiasCode = "";
    let prev = "";
    let prevVal = -1;
    let CurrentHigh = 0;
    let Count = 0;

    for (let obj in Data) {
        for (let codon in codonJSON)    {
            if (prev === codonJSON[codon]) {
                Count+=1;
                if (Data[obj][codon].split("|")[0] > prevVal) {
                    CurrentHigh = Count;
                    prevVal = Data[obj][codon].split("|")[0];
                } 
            }
            else {
                
                if (prev==="") {
                    CurrentHigh = 1
                    Count=1;
                    prev = codonJSON[codon];
                    prevVal = Data[obj][codon].split("|")[0];
                }
                else {
                    BiasCode+=String(CurrentHigh);
                    Count=0;
                    prev = codonJSON[codon];
                    prevVal = Data[obj][codon].split("|")[0];
                    CurrentHigh = 0;
                }
                
            }
            
            
        }
        NewOrder[Data[obj]["Gene"]] = BiasCode;
        BiasCode="";
    }
    const entries = Object.entries(NewOrder);
    entries.sort((a,b)=>a[1].localeCompare(b[1]));
    const sortedKeys = entries.map(entry => entry[0]);
    console.log(sortedKeys);
    return(sortedKeys)
}


export { ClusterCodonData };