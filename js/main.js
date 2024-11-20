

// Scrolling
new fullpage('#fullpage', {
	//options here
	autoScrolling:true,
	scrollHorizontally: true
});

// Globals
let scatterVis;
let myDataTable,
    myBrushVis,
    myMapVis

let selectedTimeRange = [];
let selectedState = '';

let promises = [
    // general data
    d3.csv("data/pen_2324.csv"),
    d3.json("data/goodreads_banned100.json"),
    d3.csv("data/kaggle_books.csv"),
    d3.csv("data/mergedBooks.csv"),

    // map-specific data
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),

];

Promise.all(promises)
    .then(function (data) {
        initPage(data);
    })
    .catch(function (err) {
        console.log(err)
    });

function initPage(data) {
    let penn_data = data[0];
    let goodreads100 = data[1];
    let kaggle = data[2];
    let mergedBooks = data[3];
    let geoStates = data[4];

    // Convert type all together here
    kaggle.forEach((book) => {
        book.average_rating = +book.average_rating;
        book.ratings_count = +book.ratings_count;
    })
    goodreads100.forEach((book) => {
        book.average_rating = +book.average_rating;
        book.ratings_count = +book.ratings_count;
        book.publication_year = +book.publication_year;
    })

    console.log(goodreads100);

    // Top 100 most banned books from PEN 23-24
    let banned_counts = d3.rollup(penn_data, (v) => v.length, (d) => d.Title);
    let banned_array = Array.from(banned_counts, ([key, value]) => ({key, value}));
    banned_array.sort((a, b) => b.value - a.value);
    let top100 = banned_array.slice(0, 100);
    //top100.forEach((d) => console.log(`"${d.key}"`))

    scatterVis = new scatterChart("scatter-area", goodreads100, kaggle);

    // Brushable table
    myDataTable = new DataTable('tableDiv', data[3]);
    myBrushVis = new BrushVis('brushDiv', data[3]);

    // mapVis
    myMapVis = new MapVis('mapDiv', geoStates, mergedBooks);

}

// map category changes
function categoryChange() {
    myMapVis.selectedCategory =  document.getElementById('categorySelector').value;
    myMapVis.wrangleData(); // maybe you need to change this slightly depending on the name of your MapVis instance

}