/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {
    constructor(parentElement, covidData, usaData, geoData) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.geoData = geoData;
        this.displayData = [];
        this.selectedCategory = 'absCases';
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis();
    }

    initVis() {
        let vis = this;

        // SVG setup
        vis.width = 975;
        vis.height = 800;

        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("viewBox", [0, 0, vis.width, vis.height])
            .style("max-width", "100%")
            .style("height", "auto");

        vis.color = d3.scaleQuantize([0, 5], d3.schemeBlues[9]);
// i used AI to help me with color here, since I couldn't perfectly utilize the color scale we were given.
// However, since the instructions said that CSS shoudln't matter, I thought that this shouldn't affect much.

        vis.path = d3.geoPath();

        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)");

        vis.createLegend();
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        let filteredData = [];

        if (selectedTimeRange.length !== 0) {
            //console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

            vis.covidData.forEach(row => {
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.submission_date).getTime() && vis.parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        let covidDataByState = Array.from(d3.group(filteredData, d => d.state), ([key, value]) => ({ key, value }));

        vis.displayData = [];

        covidDataByState.forEach(state => {
            let stateName = nameConverter.getFullName(state.key); // Assuming you have a name converter like in DataTable
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            vis.usaData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2020"].replace(/,/g, ''); // Parse the population
                }
            });

            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            vis.displayData.push({
                state: stateName,
                population: population,
                absCases: newCasesSum,
                absDeaths: newDeathsSum,
                relCases: population ? (newCasesSum / population) * 100 : 0, // Relative cases
                relDeaths: population ? (newDeathsSum / population) * 100 : 0 // Relative deaths
            });
        });

        //console.log('Final data structure for MapVis:', vis.displayData);

        vis.valuemap = new Map(vis.displayData.map(d => [d.state, d[vis.selectedCategory]]));
        //console.log('Value Map:', vis.valuemap);

        const maxValue = d3.max(vis.displayData, d => d[vis.selectedCategory]);
        vis.color = d3.scaleQuantize()
            .domain([0, maxValue])
            .range(d3.schemeBlues[9]);

        vis.updateVis();
    }


    updateVis() {
        let vis = this;

        vis.svg.selectAll("path").remove();

        vis.svg.append("g")
            .selectAll("path")
            .data(topojson.feature(vis.geoData, vis.geoData.objects.states).features)
            .join("path")
            .attr("fill", d => {
                const stateValue = vis.valuemap.get(d.properties.name);
                return stateValue ? vis.color(stateValue) : "#ccc";
            })
            .attr("d", vis.path)
            .on("mouseover", (event, d) => {
                const stateData = vis.displayData.find(state => state.state === d.properties.name);

                if (stateData) {
                    vis.tooltip.transition().duration(200).style("opacity", 1);
                    vis.tooltip.html(`
                    <strong>${d.properties.name}</strong><br>
                    Population: ${stateData.population}<br>
                    Absolute Cases: ${stateData.absCases}<br>
                    Relative Cases: ${stateData.relCases.toFixed(2)}%<br>
                    Absolute Deaths: ${stateData.absDeaths}<br>
                    Relative Deaths: ${stateData.relDeaths.toFixed(2)}%
                `)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", () => {
                vis.tooltip.transition().duration(500).style("opacity", 0);
            });

                //borders
            vis.svg.append("path")
            .datum(topojson.mesh(vis.geoData, vis.geoData.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", vis.path);
    }

    createLegend() {
        let vis = this;

        const legendWidth = 500;
        const legendHeight = 20;
        const legendMargin = 20;

        vis.svg.selectAll(".legend").remove();

        const legendGroup = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${(vis.width - legendWidth) / 2}, ${vis.height - legendHeight - legendMargin - 60})`);

        const staticColorScale = d3.scaleQuantize([0, 5], d3.schemeBlues[5]);

        let thresholds;
        if (vis.selectedCategory === 'absCases') {
            thresholds = [0, 1000, 2000, 5000, 10000, 20000];
        } else if (vis.selectedCategory === 'absDeaths') {
            thresholds = [0, 100, 200, 500, 1000, 2000];
        } else if (vis.selectedCategory === 'relCases') {
            thresholds = [0, 1, 2, 3, 4, 5];
        } else if (vis.selectedCategory === 'relDeaths') {
            thresholds = [0, 0.1, 0.2, 0.5, 1, 2];
        }

        const descriptiveLabels = thresholds.map((threshold, i) => {
            const lowerBound = i === 0 ? 0 : thresholds[i - 1];
            return `${lowerBound.toFixed(2)} - ${threshold.toFixed(2)}`;
        });

        descriptiveLabels.forEach((label, i) => {
            legendGroup.append("rect")
                .attr("x", i * (legendWidth / descriptiveLabels.length))
                .attr("y", 0)
                .attr("width", legendWidth / descriptiveLabels.length)
                .attr("height", legendHeight)
                .attr("fill", staticColorScale(i));
        });

        descriptiveLabels.forEach((label, i) => {
            legendGroup.append("text")
                .attr("x", i * (legendWidth / descriptiveLabels.length) + (legendWidth / descriptiveLabels.length) / 2)
                .attr("y", legendHeight + 35)
                .attr("dy", "0.14em")
                .style("font-size", "10px")
                .style("text-anchor", "middle")
                .attr("transform", `rotate(30, ${i * (legendWidth / descriptiveLabels.length) + (legendWidth / descriptiveLabels.length) / 2}, ${legendHeight + 15})`) // Adjust rotation angle as needed
                .text(label);
        });

        // Add a legend title
        legendGroup.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -5)
            .text(vis.selectedCategory === 'relCases' ? "Relative Cases (%)" :
                vis.selectedCategory === 'relDeaths' ? "Relative Deaths (%)" :
                    vis.selectedCategory === 'absCases' ? "Absolute Cases" :
                        "Absolute Deaths")
            .style("font-weight", "bold")
            .style("text-anchor", "middle");
    }



    categoryChange(selectedCategory) {
        this.selectedCategory = selectedCategory;
       this.wrangleData();
        this.createLegend();
        this.updateVis();
    }

}

