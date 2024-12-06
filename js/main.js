
let fullpageCounter = 0;
// Scrolling
new fullpage('#fullpage', {
    // Callback function
    afterLoad: function(origin, destination, direction){
        const headline = document.querySelectorAll('.headline-img');
        const storytitle = document.querySelector('#story-title');

        // on title page load
        if(destination.index == 0){
            headline.forEach((element) => element.classList.add('active'));
            storytitle.classList.add('active');
        }

        // Little circle graphic
        if (destination.index == 1 && fullpageCounter === 0) {
            circleComparison.drawCircles();
            fullpageCounter++;
        }

    },
	//options here
	autoScrolling:true,
	scrollHorizontally: true,
    normalScrollElements: '#tableDiv',
    navigation: true
});

// Globals
let scatterVis;
let myDataTable,
    myBrushVis,
    myMapVis,
    myBarVisOne,
    myBoxPlot,
    guessingGame;

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

    // goodreads tag data
    d3.json("data/banned100_characteristics.json"),

    //bannedmerged for barchart & boxplot
    d3.csv("data/bannedMerged.csv"),

    // PEN data for previous years
    d3.csv("data/PEN_2122.csv"),
    d3.csv("data/PEN_2223.csv")
];

Promise.all(promises)
    .then(function (data) {
        initPage(data);
    })
    .catch(function (err) {
        console.log(err)
    });

function initPage(data) {
    let pen_2324 = data[0];
    let goodreads100 = data[1];
    let kaggle = data[2];
    let mergedBooks = data[3];
    let geoStates = data[4];

    let book_characteristics = data[5];
    let banned_data = data[6];

    let pen_2122 = data[7];
    let pen_2223 = data[8];

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

    

    // Top 100 most banned books from PEN 23-24
    let banned_counts = d3.rollup(pen_2324, (v) => v.length, (d) => d.Title);
    let banned_array = Array.from(banned_counts, ([key, value]) => ({key, value}));
    banned_array.sort((a, b) => b.value - a.value);
    let top100 = banned_array.slice(0, 100);
    //top100.forEach((d) => console.log(`"${d.key}"`))
    //console.log(top100)
    goodreads100.forEach((book) => {
        top100.forEach((d => {
            if (d.key == book.title) {
                book.bans = d.value;
            }
        }))
    })

    // Create event handler (from week 9 lab)
    let eventHandler = {
        bind: (eventName, handler) => {
            document.body.addEventListener(eventName, handler);
        },
        trigger: (eventName, extraParameters) => {
            document.body.dispatchEvent(new CustomEvent(eventName, {
                detail: extraParameters
            }));
        }
    }
    // Bind event handler
    // when 'stateClick' is triggered, specified function is called
    eventHandler.bind("stateClick", function(event){
        let stateName = event.detail;
        console.log(stateName)
        myMapBar.onStateClick(stateName);
    });

    // Interactive scatterplot
    scatterVis = new scatterChart("scatter-area", goodreads100, kaggle);

    // Brushable table
    myDataTable = new DataTable('tableDiv', data[3]);
    myBrushVis = new BrushVis('brushDiv', data[3]);
    // mapVis
    guessingGame = new mapGuess('guessingGame', geoStates, mergedBooks);
    myMapVis = new MapVis('mapDiv', geoStates, mergedBooks, eventHandler);
    myMapBar = new MapBar("map-bar", summarizePenData(pen_2122), summarizePenData(pen_2223), summarizePenData(pen_2324))

    // Bubbles sortable by tag
    tagBubbles = new tagVis("tagbubbles-area", book_characteristics);

    // Boxplot & barchart of reasons 
    let topReasons = [];
    myBarVisOne = new BarVis('barvis-area', banned_data);
    myBoxPlot = new BoxPlotVis('boxplot-area', banned_data, topReasons);

    // Intro circles
    circleComparison = new compareCircles("compareCircles", 275, pen_2122.length, pen_2223.length, pen_2324.length)

}

// map category changes
function mapCategoryChange() {
    //myMapVis.selectedCategory =  document.getElementById('mapCategorySelector').value;
    myMapVis.wrangleData(); // maybe you need to change this slightly depending on the name of your MapVis instance
}

function tagChecked() {
    // from https://stackoverflow.com/a/61598154
    const selectedboxes = [...document.querySelectorAll('.tags:checked')].map((d) => d.value);
    
    tagBubbles.boxCheck(selectedboxes);
}

// Bans per state for '21-'22, '22-'23, and '23-'24
function summarizePenData(data) {
    let stateRoll = d3.group(data, (d) => d.State)
    stateRoll = Array.from(stateRoll, ([key, value]) => ({key, value}));
   /*  let penArr = Array.from(stateRoll, (state) => {
        let element = {
            state: state.key,
            totalBans: state.value.length,
            uniqueBooksBanned: d3.group(state.value, (d) => d.Title).size
        }
        return element;
    }) */
    let penArr = {};
    stateRoll.forEach((state) => {
        let element = {
            totalBans: state.value.length,
            uniqueBooksBanned: d3.group(state.value, (d) => d.Title).size
        }
        penArr[state.key] = element;
    })
    
    return penArr;
}

function playGuessingGame()
{
    guessingGame.gameStatus = "playing";
    guessingGame.updateVis();
}

function stopGuessingGame()
{
    guessingGame.gameStatus = "revealing answers";
    guessingGame.updateVis();
}