class scatterChart {
    
	constructor(parentElement, bannedData, popularData) {
		this.parentElement = parentElement;
		this.bannedData = bannedData;
		this.popularData = popularData;

        this.initVis()
	}

    initVis() {
		let vis = this; 
		
        vis.margin = {top: 40, right: 60, bottom: 40, left: 40};

		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width * 0.8 - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

		// SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// Scales
		vis.xScale = d3.scaleLog()
			.range([0, vis.width]);
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

		//Timelines scale?
		vis.xTimeScale = d3.scaleLinear()
			.range([0, vis.width]);
		
		// Horrible temporary rectangle
		vis.timelineTrigger = vis.svg.append("rect")
			.attr("x", -40)
			.attr("y", 0)
			.attr("height", 10)	
			.attr("width", 10)
			.attr("fill", "black");
			
          
        this.restoreElems();
    }

	restoreElems() {
		let vis = this;

		// Tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr("class", "tooltip")
			.attr("id", "tooltip")

		// Generate axes 
        vis.yAxisG = vis.svg.append("g")
            .attr("class", "axis y-axis");            
        vis.xAxisG = vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0, ${vis.height})`);

		vis.wrangleData();
	}

	wrangleData() {
		let vis = this;

		vis.displayData = [];
		vis.popularBooks = [];

		console.log(vis.popularData)

		vis.bannedData.forEach(book => {
            book.selected = false;
            vis.displayData.push(book);
        });


		// For timelines things
		console.log(vis.bannedData)
		//console.log(d3.group(vis.bannedData, d => d.publication_year).get(vis.bannedData[100].publication_year))
		//console.log(d3.group(vis.bannedData, d => d.publication_year).get(vis.bannedData[100].publication_year).indexOf(vis.bannedData[100]))

		// Highest rated
		vis.popularData.filter((book) => book.ratings_count > 1000).sort((a, b) => b.average_rating - a.average_rating).slice(0, 100).forEach(book => {
			book.selected = false;
			vis.popularBooks.push(book);
		});
		// Most rated
		vis.popularData.sort((a, b) => b.ratings_count - a.ratings_count).slice(0, 100).forEach(book => {
			book.selected = false;
			vis.popularBooks.push(book);
		});

		//Timeline scale
		// Need to fix the guys with year = 0 for whatever reason
		vis.xTimeScale.domain([1965, d3.max(vis.displayData, (d) => d.publication_year)])
		console.log(vis.xTimeScale(1945))
		console.log(vis.xTimeScale(2014))

		
		console.log(vis.bannedData);
		
		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		vis.timelineTrigger
			.on("click", function(){
				d3.select(this).on("click", null);
				vis.timelineSort();
			});

		// Crucial unit of measurement
		vis.circleRadius = 5;

		// Update scales
        vis.yScale.domain([2.7, 5]);
        vis.xScale.domain([d3.min(vis.displayData, (d) => d.ratings_count) - (d3.min(vis.displayData, (d) => d.ratings_count) / 2), d3.max(vis.popularBooks, (d) => d.ratings_count)]);

		console.log(d3.min(vis.displayData, (d) => d.ratings_count))
		console.log(vis.xScale(10))

		// Axes
        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale);
        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale);
		vis.xAxisG
			.style("opacity", 1)
            .call(vis.xAxis);
        vis.yAxisG
			.call(vis.yAxis)
			.transition()
			.duration(300)
			.style("opacity", 1);

		vis.popularCircles = vis.svg.selectAll("circle.popular")
            .data(vis.popularBooks, (d) => d.title);

		// for some reason enter selection is not empty after infobox and return--check out
		vis.popularCircles.enter()
			.append("circle")
			.style("opacity", 1)
			.merge(vis.popularCircles)
			.attr("cx", (d) => vis.xScale(d.ratings_count))
			.attr("cy", (d) => vis.yScale(d.average_rating))
			.attr("r", vis.circleRadius)
			.attr("fill", "lightgrey")
			.attr("class", "popular")
			.transition()
			.duration(400)
			.style("opacity", 1);

		vis.bannedCircles = vis.svg.selectAll("circle.banned")
            .data(vis.displayData, (d) => d.book_id);

		vis.bannedCircles.enter()
			.append("circle")
			.attr("cx", (d) => vis.xScale(d.ratings_count))
			.attr("cy", (d) => vis.yScale(d.average_rating))
			.attr("r", vis.circleRadius)
			.attr("fill", "darkblue")
			.style("opacity", 1)
			.attr("class", "banned")
			.merge(vis.bannedCircles)
			.attr("r", vis.circleRadius)
			.attr("fill", "darkblue")
			.style("opacity", 1)
			.attr("class", "banned")
			// Tooltip listeners
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgb(0,255,0)')

                vis.tooltip
                    .style("opacity", 1)
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: white; padding: 20px">
                            <h3>${d.title}</h3>
							<img src=${d.image_url} alt="Cover of ${d.title}" height="150">
							<p><i>click for more info</i></p>             
                        </div>`); 

				let tooltipHeight = document.getElementById("tooltip").getBoundingClientRect().height;
				let parentSize = document.getElementById(vis.parentElement).getBoundingClientRect();

				vis.tooltip
					.style("left", () => {
						return event.pageX + 20 + "px";
					})
					.style("top", () => {
						return event.pageY + tooltipHeight > parentSize.y + parentSize.height ?  event.pageY - tooltipHeight + "px" : event.pageY + "px";
					})
				//console.log("bounded", document.getElementById("tooltip").getBoundingClientRect())
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", "darkblue")

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
			.on('click', function(event, d){
				d.selected = true;

				vis.tooltip
                    .remove();

				d3.select(this)
					.attr("class", "selected");

				// Take away his clicking power
				d3.select(this).on('click',null);
				d3.select(this).on('mouseover',null);
				d3.select(this).on('mouseout',null);
				vis.timelineTrigger.on('click',null);

				d3.selectAll("circle.banned")
					.transition()
					.duration(300)
					.style("opacity", 0)
					.remove();
				d3.selectAll("circle.popular")
					.transition()
					.duration(300)
					.style("opacity", 0);
				d3.select(".x-axis")
					.transition()
					.duration(300)
					.style("opacity", 0)
					.remove()
				d3.select(".y-axis")
					.transition()
					.duration(300)
					.style("opacity", 0)
					.remove()

				// Move him to upper left
				d3.select(this)
					.transition()
					.duration(600)
					.on("end", function(d){
						vis.focusVis(d, this)
					})
					.attr("cx", vis.width / 14)
					.attr("cy", vis.height / 14);
            })
			.transition()
			.duration(400)
			.attr("cx", (d) => vis.xScale(d.ratings_count))
			.attr("cy", (d) => vis.yScale(d.average_rating))
		
	}

	focusVis(book, circle){
		let vis = this;

		console.log(book)
		vis.infoBox = vis.svg.append("g")
			.attr("transform", "translate(" + (vis.width / 14 + vis.circleRadius * 2) + "," + (vis.height / 14 + vis.circleRadius * 2) + ")");
		
		vis.infoBox
			.append("rect")
			.attr("id", "infoRect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", vis.width - vis.margin.right)
			.attr("height", vis.height * 0.7)
			.attr("stroke", "black")
			.attr("fill", "rgba(0, 0, 0, 0)")

		let imageHeight = vis.height * 0.4;
		
		let coverImage = vis.infoBox
			.append("image")
			.attr("xlink:href", book.image_url)
			.attr("id", "coverImage")
			.attr('height', imageHeight)
			.attr("x", vis.circleRadius * 3)
			.attr("y", vis.height * 0.7 / 2 - imageHeight / 2)

		// Title
		vis.infoBox
			.append("text")
			.attr("x", vis.width - vis.margin.right - vis.circleRadius * 3)
			.attr("y", vis.circleRadius * 5)
			.attr("text-anchor", "end")
			.text(`${book.title}`);
		
		let coverImg = coverImage.node().getBBox();
		//let image_x = parseInt(d3.select("#coverImage").attr("y"));

		// Ratings
		console.log("image width", coverImg)
		vis.infoBox
			.append("text")
			.attr("x", coverImg.x + coverImg.width + vis.circleRadius * 3)
			.attr("y", coverImg.y)
			//.attr("text-anchor", "end")
			.text(`Average Goodreads rating: ${book.average_rating}`)

		// Additional info
		/*
		let additionalInfo = d3.select("body").append('div')
			.attr('id', "additionalInfo")
			.attr("class", "tooltip")
			.style("opacity", 1)
			.style("left", (image_x + vis.width / 2) + "px")
			.style("top", (image_y + (vis.height / 14 + vis.circleRadius * 2) + vis.margin.top) + "px")
			//border: thin solid grey; border-radius: 5px; background: white; 
			.html(`
				<div style="padding: 20px">
					<p>average rating: ${book.average_rating}</p>    
					<p>#ratings: ${book.ratings_count}</p>
					<p>etc etc would like reasons here</p>         
				</div>`);   
		*/
		d3.select("circle.selected")
			.attr("fill", "red")
			.on('click', function(event, d) {
				
				vis.infoBox
					.remove();

				/*additionalInfo
					.remove();
				*/

				d3.select(this)
					.attr("class", "banned")
					.transition()
					.duration(700)
					.attr("cx", (d) => vis.xScale(d.ratings_count))
					.attr("cy", (d) => vis.yScale(d.average_rating))
					.on("end", function(){
						vis.restoreElems();
					})		
			})
	}

	timelineSort(){
		let vis = this;

		d3.select("#scatterTitle")
			.text("When were the most frequently banned books of 2023-24 published?")

		vis.yAxisG
			.transition()
			.duration(300)
			.style("opacity", 0);

		vis.xAxis
			.scale(vis.xTimeScale)
			.tickFormat(d3.format("d"));

		d3.select(".x-axis")
			.transition()
			.call(vis.xAxis);

		d3.selectAll("circle.popular")
			.transition()
			.duration(300)
			.style("opacity", 0);

		d3.selectAll("circle.banned")
			.transition()
			.duration(600)
			.attr("cx", (d) => {
				return vis.xTimeScale(d.publication_year);
			})
			.attr("cy", (d) => {
				console.log(d3.group(vis.bannedData, row => row.publication_year))
				let yearIndex =  d3.group(vis.bannedData, row => row.publication_year).get(d.publication_year).indexOf(d);
				return vis.height - (yearIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
			})
	
		
		vis.timelineTrigger
			.on("click", function(){
				d3.select("#scatterTitle")
					.text("Are the most frequently banned books popular or well-rated?")

				vis.updateVis()
			})
	}
	
}