/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */

class BarVis {

constructor(parentElement, covidData, usaData, descending = true ){
            this.parentElement = parentElement;
            this.covidData = covidData;
            this.usaData = usaData;
            this.descending = descending;
            this.selectedCategory = 'absCases';
            this.parseDate = d3.timeParse("%m/%d/%Y");

            this.initVis()
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text(' Top and Bottom 10 States for Covid')
            .attr('transform', `translate(${vis.width / 2}, 10)`)
            .attr('text-anchor', 'middle');

        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'barTooltip')

        // TODO
            vis.xScale = d3.scaleLinear().range([0, vis.width]);
            vis.yScale = d3.scaleBand().range([0, vis.height]).padding(0.1);

            vis.xAxis = d3.axisBottom(vis.xScale);
            vis.yAxis = d3.axisLeft(vis.yScale);

            vis.svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${vis.height})`);
            vis.svg.append('g').attr('class', 'y-axis');

            vis.tooltip = d3.select("body") // or any specific container
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0) // Start hidden
            .style("position", "absolute") // Required for positioning
            .style("pointer-events", "none") // Prevents mouse events on the tooltip
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)");

        this.wrangleData();
    }

    wrangleData() {
        let vis = this;

        let filteredData = [];

        // Filter data by selected time range
        if (selectedTimeRange.length !== 0) {
            vis.covidData.forEach(row => {
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.submission_date).getTime() &&
                    vis.parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // Group COVID data by state
        let covidDataByState = Array.from(d3.group(filteredData, d => d.state), ([key, value]) => ({ key, value }));

        // Initialize the displayData structure
        vis.displayData = [];

        // Merge COVID and population data
        covidDataByState.forEach(state => {
            let stateName = nameConverter.getFullName(state.key);
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // Look up population for the state in the usaData
            vis.usaData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2020"].replace(/,/g, '');
                }
            });

            // Sum up new cases and deaths
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            vis.displayData.push({
                state: stateName,
                population: population,
                absCases: newCasesSum,
                absDeaths: newDeathsSum,
                relCases: population ? (newCasesSum / population) * 100 : 0,
                relDeaths: population ? (newDeathsSum / population) * 100 : 0
            });
        });

        // Sort and filter the displayData for top/bottom 10
        if (vis.descending) {
            vis.displayData.sort((a, b) => b[vis.selectedCategory] - a[vis.selectedCategory]);
        } else {
            vis.displayData.sort((a, b) => a[vis.selectedCategory] - b[vis.selectedCategory]);
        }

        vis.topTenData = vis.displayData.slice(0, 10);
        vis.bottomTenData = vis.displayData.slice(-10);

        // Update the visualization with the top ten data
        vis.displayData = vis.topTenData;

        vis.updateVis();
    }

    updateVis(){
        let vis = this;
        console.log('here')

        // Update scales
        vis.xScale.domain([0, d3.max(vis.displayData, d => d[vis.selectedCategory])]);
        vis.yScale.domain(vis.displayData.map(d => d.state));

        // Draw axes
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

        // Bind data to bars
        let bars = vis.svg.selectAll(".bar")
            .data(vis.displayData, d => d.state);

        // Enter, Update, Exit
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => vis.yScale(d.state))
            .attr("height", vis.yScale.bandwidth())
            .attr("x", 0)
            .attr("fill", '#0a306b')
            .attr("width", d => vis.xScale(d[vis.selectedCategory]))
            .merge(bars)

            .on("mouseover", (event, d) => {
                console.log("Mouse over state:", d.state); // Debug log
                    vis.tooltip.transition().duration(200).style("opacity", 1);
                    vis.tooltip.html(`
                    <strong>${d.state}</strong><br>
                    Population: ${d.population}<br>
                    Absolute Cases: ${d.absCases}<br>
                    Relative Cases: ${d.relCases.toFixed(2)}%<br>
                    Absolute Deaths: ${d.absDeaths}<br>
                    Relative Deaths: ${d.relDeaths.toFixed(2)}%
                `)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");

            })
            .on("mouseout", () => {
                vis.tooltip.transition().duration(500).style("opacity", 0);
            })

            .transition()
            .duration(500)
            .attr("width", d => vis.xScale(d[vis.selectedCategory]));




        // Tooltip for bars


        bars.exit().remove();

    }

    categoryChange(selectedCategory) {
        this.selectedCategory = selectedCategory; // Update the selected category
        this.wrangleData();
        this.updateVis(); // Update the visualization with the new data
    }

}