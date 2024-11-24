
class MapVis {

    // constructor method to initialize Timeline object
    constructor(parentElement, geoData, bookData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.bookData = bookData;
        // this.covidData = covidData;
        // this.usaData = usaData;

        //console.log(bookData);
        this.displayData = [];
        this.colors = d3.scaleSequential()
            .interpolator(t => d3.interpolateBlues(0.15 + t * 0.8)); // referenced gpt: skips the lightest 20% of the range
        // .range(["#6f9c3d", "#a5c90f",
        //     "#ffb366", "#ff8829", "#fe6b40", "#a22626"]);
        //     .range(["#6f9c3d", "#a5c90f",
        //         "#ff8829", "#A2264B", "#A2264B", "#A2264B"]);

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis()
    }

    initVis() {
        let vis = this;

        //console.log(vis.geoData)
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = vis.width / vis.viewpoint.width;

        // code to center. referenced gpt
        const translateX = vis.width / 2 * (1 - vis.zoom);
        const translateY = vis.height / 2 * (1 - vis.zoom);

        // adjust map position
        vis.map = vis.svg.append("g") // group will contain all state paths
            .attr("class", "states map")
            // .attr('transform', `scale(${vis.zoom} ${vis.zoom})`)
            .attr(
            'transform',
            `translate(${translateX}, ${translateY}) scale(${vis.zoom} ${vis.zoom})`
        );




        vis.tooltip = d3.select("#" + vis.parentElement).append('div')
            .attr('class', 'tooltip map')
            .attr("width", vis.width * .4)
            .attr("height", vis.height * .4)
            .attr('id', 'map-tooltip')

        // TODO
        let zoom = 249.5




        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width/2, vis.height/2])
            .scale(1200)
        vis.path = d3.geoPath()
            .projection(vis.projection);
        // //console.log("geodata states",  vis.geoData.objects.states)
        vis.US = topojson.feature(vis.geoData, vis.geoData.objects.states).features
        // //console.log(vis.US[0])
        vis.states = vis.map.selectAll("path")
            .data(vis.US)
            .enter()
            .append("path")
            .attr('class', 'state map')
            .attr("d", vis.path)

        // vis.legendScale = d3.scaleLinear()
        //     .domain(vis.colors.domain())
        //     .range([0, 200]); // determines width of the overall legend, and position of each
        //
        // vis.legendColors = vis.colors.range().map( // referenced gpt on how to create object from list. covered in class previously
        //     color => {
        //     const d = vis.colors.invertExtent(color); // used previously in class, modified  to output a range of px values for each color, later used to define width
        //     return {
        //         color: color,
        //         min: d[0],
        //         max: d[1]
        //     };
        // })
        // let legendRects = vis.svg.selectAll(".legend-rect.map")
        //     .data(vis.legendColors)
        // legendRects.enter().append("rect")
        //     .attr("class", "legend-rect map")
        //     .merge(legendRects)
        //     .attr("x", d => vis.legendScale(d.min)) // starting position for the rectangle. referenced gpt
        //     .attr("width", d => vis.legendScale(d.max) - vis.legendScale(d.min)) // determine width based off of inversion. referenced gpt
        //     .attr("height", 20)
        //     .attr("transform", `translate(${vis.width - 225 - 20}, ${vis.height - 30 - 20})`)
        //     .style("fill", d => d.color);
        let legendWidth = 300;
        let legendHeight = 20;

        let svgLegend = vis.svg // Replace with the specific container for the legend
            .append("svg")
            .attr("class","svg-legend")
            .attr("width", legendWidth + 50)
            .attr("height", legendHeight);

        const gradient = svgLegend.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

    // Add color stops to the gradient
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", vis.colors(vis.colors.domain[0]));

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", vis.colors(vis.colors.domain[1]));

    // Add a rectangle with the gradient
            svgLegend.append("rect")
                .attr("x", 20)
                .attr("y", 20)
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legend-gradient)");



        // wrangleData
        vis.wrangleData()
    }

    allBanStatusTypes() { // referenced gpt
        // Create a Set to store unique ban statuses
        let vis = this
        let uniqueStatuses = new Set();

        vis.bookData.forEach(row => {
            let banStatus = row['Ban Status']; // Column name for ban status
            if (banStatus) {
                uniqueStatuses.add(banStatus.trim());
            }
        });

        // Convert the Set to an array for easy handling
        uniqueStatuses = Array.from(uniqueStatuses);

        // let allCategories = d3.selectAll('#mapCategorySelector').data(uniqueStatuses)
        //
        // allCategories.enter().append("option")
        //         .merge(allCategories)
        //         .attr("value", d => d.toLowerCase())

        //console.log("uniqueStatuses", uniqueStatuses);

        return(uniqueStatuses);
    }
     highestBooksByState()
     {
         let vis = this
         let topBooksByState = {}

         vis.bookData.forEach(row => {
             let state = row['State']
             let banStatus = row['Ban Status'];
             let totalRatings = parseInt(row['ratings_count']);
             let title = row['Title'];
             let author = row['Author'];
             let reason = row['Initiating Action']



             if(banStatus != null && banStatus.toLowerCase() === vis.selectedCategory || vis.selectedCategory === "all ban types") // property exists and the type of ban we want
             {

                 // if no data for state, add. else add if greatest rating so far
                 if(!topBooksByState[state] || topBooksByState[state].totalRatings < totalRatings)
                 {
                     topBooksByState[state] = {
                         title: title,
                         authors: author,
                         reason_banned: reason,
                         totalRatings: totalRatings
                     };
                 }
             }
         })
         console.log("total restricted books: ", vis.bookData)
         console.log("top books by state", topBooksByState)
         return topBooksByState
     }
    totalStatusByState()
    {
        let vis = this
        vis.selectedCategory =  document.getElementById('mapCategorySelector').value;

        let bannedBooksByState = {};

        vis.bookData.forEach(row => { // referenced gpt
            const state = row['State']; // Column name for state
            const banStatus = row['Ban Status']; // Column name for ban status
            if(vis.selectedCategory === "all ban types")
            {
                if (!bannedBooksByState[state]) {
                    bannedBooksByState[state] = 0;
                }
                bannedBooksByState[state]++;
            }
            // Only count if the book is banned
            else if (banStatus.toLowerCase() ===  vis.selectedCategory) {
                if (!bannedBooksByState[state]) {
                    bannedBooksByState[state] = 0;
                }
                bannedBooksByState[state]++;
            }
        });

        console.log("bannedBooksByState", bannedBooksByState);
        return bannedBooksByState

    }
    wrangleData() {


        let vis = this
        vis.selectedCategory =  document.getElementById('mapCategorySelector').value;

        vis.tallyStatusByState = vis.totalStatusByState()
        vis.topBooksByState = vis.highestBooksByState()
        vis.allBanStatusTypes()

        vis.colors.domain([
            d3.min(Object.values(vis.tallyStatusByState), function(d) { return d; }),
            d3.max(Object.values(vis.tallyStatusByState), function(d) { return d; })
        ]);

        // //console.log("colors domain", vis.colors.domain())

        vis.updateVis()

    }

    updateVis() {
        let vis = this;

        //console.log("updating vis")
        d3.selectAll(".state").each(function(d)
        { // d represents vis.world data bound to each element
           try
           {
               let name = d.properties.name
               // console.log("tally", vis.topBooksByState[d.properties.name] ? vis.tallyStatusByState[d.properties.name] : 0)
               let tally =  vis.tallyStatusByState[name]  ? vis.tallyStatusByState[name] : 0
               let color = vis.colors(tally);

               d3.select(this)
                   .style("fill", color)
                   //.style("opacity", .8)
                   .text(tally === 0 ? "" : tally)


               //console.log(d3.geoCentroid(d)[1])
               let stateLabel = vis.svg.selectAll(`#${name}-label`).data(d)
               stateLabel.enter().append("text")
                   .class(`#${name}-label map`)
                   .merge(stateLabel)
                   .text(tally === 0 ? "" : tally)
                   // .attr("transform", `translate(${d3.geoCentroid(d)[0] * -1}, ${d3.geoCentroid(d)[1]})`)
                   .attr("x", 0) // X-coordinate of state centroid
                   .attr("y", 0) // Y-coordinate of state centroid
                   .attr("text-anchor", "middle")
                   .attr("font-size", "50px")

           }
           catch
           {
              //console.log("region/state not in data: ", d.properties.name)
           }
        });

        // let maxProp = d3.max(vis.topBooksByState)
        // let minProp = d3.min(vis.topBooksByState)
        //
        // vis.svg.selectAll(".tick").remove()
        // let legendScale = d3.scaleLinear()
        //     .domain([minProp, maxProp]) // Map from 0 to number of colors - 1
        //     .range([0, 133]); // Range is the width of the legend
        //
        // let legendAxis = d3.axisBottom(legendScale)
        //     .tickValues([maxProp, minProp])
        // // gets minimum -- cannot duplicate from legendColors since data function not work for axes
        // ////console.log("legend axis", legendAxis);
        // let ticks = d3.select(".tick").exit().remove();
        // vis.svg.append("g")
        //     .attr("id", "legend-label")
        //     .attr("transform", `translate(${vis.width - 200 - 45}, ${vis.height - 30})`)
        //     .call(legendAxis)
        //     .select(".domain").remove();

        //console.log(d3.selectAll(".state").nodes());
        d3.selectAll(".state").on('mouseover', function(event, d) {
            //console.log("mouseover")

            // topBooksByState[state] = {
            //     title: title,
            //     authors: author,
            //     reason_banned: reason,
            //     totalRatings: totalRatings

            let state = d.properties.name
            let stateData = vis.topBooksByState[state] != undefined ? vis.topBooksByState[state] : {
                    title: "NA",
                    authors: "NA",
                    reason_banned: "NA",
                    totalRatings: "NA"
            }
            vis.tooltip.html(`
                            <h3>${state}'s Top Banned Book</h3>
                            Title: ${stateData.title} <br><br>
                            Authors: ${stateData.authors} <br><br>
                            Reason Banned: ${stateData.reason_banned} <br><br>
                            Total Ratings: ${stateData.totalRatings} <br><br>
                        `);

            // Get the bounding rectangle of the hovered element. referenced GPT
            let { x, y } = this.getBoundingClientRect();
            let positionFactor = -180


            vis.tooltip.style("opacity", 1)
                .style("top", `${y}px`)//.attr("transform", "translate(" +x + "," + y + ")")
                .style("left", `${x <= 150 ? x : x + positionFactor}px`)

        })


    }


}