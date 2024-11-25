class tagVis {
    constructor(parentElement, tagData) {
		this.parentElement = parentElement;
		this.tagData = tagData;

        this.initVis()
	}

    initVis() {
        let vis = this; 

        // Margin convention
        let parentWidth = document.getElementById(vis.parentElement).getBoundingClientRect().width;
        let parentHeight = document.getElementById(vis.parentElement).getBoundingClientRect().height;
        console.log(parentWidth, parentHeight)
        
        vis.circleRadius = parentWidth / 2 / 22;

		vis.margin = { top: vis.circleRadius, right: vis.circleRadius, bottom: vis.circleRadius, left: vis.circleRadius};

		vis.width = parentWidth - vis.margin.left - vis.margin.right;
		vis.height = parentHeight - vis.margin.top - vis.margin.bottom;
		
        //vis.margin = {top: 0, right: 0, bottom: 0, left: 0};

		//vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		//vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

		// SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Setup for force layout
        vis.tags = ["sexually-explicit",
            "sexual-assault",
            "abuse",
            "mental-health",
            "lgbtq",
            "drugs",
            "death",
            "profanity",
            "explores-race"
        ]

        vis.circleRadius = vis.width / 2 / 22;

        // Force layout
        vis.simulation = d3.forceSimulation()
            .force("collide", d3.forceCollide().radius(function(d){return vis.circleRadius;}).strength(0.4))
            .velocityDecay(0.2)  
            //.force('charge', d3.forceManyBody().strength((d) => -Math.pow(10, 2.0) * 0.01))
            //.force("center", d3.forceCenter(vis.width / 2, vis.height / 2));
        
        // Assign nodes to force layout
        vis.nodes = vis.tagData;
        vis.simulation
            .nodes(vis.nodes);
        // Initial configuration
        vis.simulation            
            .force("x", d3.forceX().strength(0.04).x((d) => {
                return d["profanity"] ? vis.width / 4 * 3: vis.width / 4;
            }))
            .force("y", d3.forceY(vis.height / 2).strength(0.04));
        // Initial simulation ticks
        vis.simulation
            .on("tick", function() {
			    vis.bubbles
			        .attr("cx", function(d) { return d.x; })
			        .attr("cy", function(d) { return d.y; });
            });

    
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        
        //Create nodes as circles
        vis.bubbles = vis.svg
            .append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(vis.nodes)
            .enter()
            .append("circle")
            .attr("r", vis.circleRadius)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("fill", (d) => d["profanity"] ? "red" : "grey")
            // Could use string(first letter + hash) instead i guess. might be faster but idk if that's a concern really
            .attr("id", (d) => d.title.replaceAll(" ", "").replaceAll(":", "").replaceAll("'", ""))
    }

    boxCheck(boxes) {
        let vis = this;

        console.log(boxes)

        vis.simulation
            .force("x", d3.forceX().strength(0.04).x((d) => {
                let truthArray = [];
                let title = d.title.replaceAll(" ", "").replaceAll(":", "").replaceAll("'", "");

                boxes.forEach((tagName) => {
                    truthArray.push(d[tagName])
                })

                console.log(truthArray.length)

                if (truthArray.length != 0) {
                    if (truthArray.every(Boolean)) {
                        //vis.svg.selectAll(`[id='${title}']`)
                        //    .attr("fill", "red");
                        d.side = "right";
                        //return vis.width / 4 * 3;
                    }
                    else {
                        //vis.svg.selectAll(`[id='${title}']`)
                        //    .attr("fill", "grey");
                        d.side = "left";
                        //return vis.width / 4;
                    }
                    vis.bubbles
			            .attr("fill", (d) => d.side === "right" ? "red" : "grey");
                    return truthArray.every(Boolean) ? vis.width / 4 * 3: vis.width / 4;
                }
                else {
                    d.side = "middle";
                    vis.bubbles
			            .attr("fill", (d) => d.side === "middle" ? "grey" : "grey")
                    //vis.svg.selectAll(`[id='${title}']`)
                    //        .attr("fill", "grey");
                    return vis.width / 2;
                }
            }))

        vis.simulation.alpha(1).restart();
    }
}