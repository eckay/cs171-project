/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let myDataTable,
    myMapVis,
    myBarVisOne,
    myBarVisTwo,
    myBrushVis;

let selectedTimeRange = [];
let selectedState = '';


// load data using promises
let promises = [

    // d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),  // not projected -> you need to do it
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"), // already projected -> you can just scale it to fit your browser window
    d3.csv("data/covid_data_20.csv"),
    d3.csv("data/updatedPENdata.csv"),
    d3.csv("data/full.csv"),
    d3.csv("data/mergedBooks.csv"),
    d3.csv("data/census_usa.csv")
];

/*

d3.csv("data/updatedPENdata.csv").then(function(updatedPENdata) {
    d3.csv("data/books2.csv").then(function(books2) {

        let books2Map = new Map();
        books2.forEach(book => {
            books2Map.set(book.title, book);
        });

        let updatedPENMap = new Map();
        updatedPENdata.forEach(book => {
            updatedPENMap.set(book.Title, book);
        });

        console.log(books2Map, updatedPENMap);

        let mergedData = [];
        updatedPENdata.forEach(penBook => {
            let matchingBook = books2Map.get(penBook.Title);
            if (matchingBook) {
                let mergedBook = { ...penBook, ...matchingBook };
                mergedData.push(mergedBook);
            }
        });

        console.log('Merged Data:', mergedData);

        let csvOutput = d3.csvFormat(mergedData);

        let blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });

        let link = document.createElement("a");
        if (link.download !== undefined) {  // For browsers that support download attribute
            let url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "mergedBooks.csv");
            link.style.visibility = "hidden";  // Make the link invisible
            document.body.appendChild(link);
            link.click();  // Simulate a click to download the file
            document.body.removeChild(link);  // Remove the link after clicking
        }
    });
});

*/


Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

function initMainPage(dataArray) {

    console.log('check out the data', dataArray);
     myDataTable = new DataTable('tableDiv', dataArray[4]);

    //myDataTable = new DataTable('tableDiv', dataArray[1], dataArray[2]);

    // TODO - init map
    myMapVis = new MapVis('mapDiv', dataArray[1], dataArray[2], dataArray[0]);
    //0 = geo json data, 1 = covid data, 2 = census data


    // TODO - init bars
    myBarVisOne = new BarVis('barDivOne', dataArray[1], dataArray[2], true);
    myBarVisTwo = new BarVis('barDivTwo', dataArray[1], dataArray[2], false);
    myBrushVis = new BrushVis('brushDiv', dataArray[4]);

}

function updateVisualizations(selectedCategory) {
    myMapVis.categoryChange(selectedCategory);
    myBarVisOne.categoryChange(selectedCategory);
    myBarVisTwo.categoryChange(selectedCategory);

}


