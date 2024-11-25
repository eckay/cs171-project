class BarVis {
    constructor(parentElement, bookData) {
        this.parentElement = parentElement;
        this.bookData = bookData;
        this.topWords = [];
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 50, left: 50 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        vis.xAxis = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.yAxis = vis.svg.append("g")
            .attr("class", "y-axis");

        vis.svg.append('text')
            .attr('class', 'title')
            .attr('x', vis.width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .text('Top 10 Most Frequently Banned Books');

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        let reasons = vis.bookData
            .map(d => d.Reason)
            .filter(d => d)
            .join(" ")
            .toLowerCase();

        reasons = reasons.replace(/[.,!?;:()"]/g, "");
        let words = reasons.split(/\s+/);

        let stopwords = new Set(["thought","characters","lgbt","additional", "promote","because", "banned", "challenged","and", "the", "for", "was", "to", "it", "with", "of", "a", "in", "on", "that", "is", "be", "as"]);
        let filteredWords = words.filter(word => word && !stopwords.has(word));

        let bigrams = [];
        for (let i = 0; i < filteredWords.length - 1; i++) {
            bigrams.push(`${filteredWords[i]} ${filteredWords[i + 1]}`);
        }

        let bigramCounts = {};
        bigrams.forEach(bigram => {
            bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
        });

        let sortedBigrams = Object.entries(bigramCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([bigram, count]) => ({ word: bigram, count }));

        let usedWords = new Set();
        vis.topWords = [];

        sortedBigrams.forEach(bigramObj => {
            let [word1, word2] = bigramObj.word.split(" ");
            if (!usedWords.has(word1) && !usedWords.has(word2)) {
                vis.topWords.push(bigramObj);
                usedWords.add(word1);
                usedWords.add(word2);
            }

            if (vis.topWords.length >= 10) {
                return;
            }
        });

        vis.topWords = vis.topWords.slice(0, 10);

        topReasons = vis.topWords;

        vis.updateVis();

    }



    wrangleData2() {
        //this one does stand alone words
        let vis = this;

        let reasons = vis.bookData
            .map(d => d.Reason)
            .filter(d => d) // Exclude null/undefined/empty values
            .join(" ")
            .toLowerCase();

        console.log("Combined Reasons:", reasons);

        reasons = reasons.replace(/[.,!?;:()"]/g, "");
        let words = reasons.split(/\s+/);

        console.log("Extracted Words:", words);

        let stopwords = new Set(["challenged","because","unsuited","viewpoint","and", "the", "for", "was", "to", "it", "with", "of", "a", "in", "on", "that", "is", "be", "as"]);
        let filteredWords = words.filter(word => word && !stopwords.has(word));

        console.log("Filtered Words:", filteredWords);

        let wordCounts = {};
        filteredWords.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

        console.log("Word Counts:", wordCounts);

        vis.topWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        console.log("Top Words:", vis.topWords);

        vis.updateVis();
    }


    updateVis() {
        let vis = this;

        vis.xScale.domain(vis.topWords.map(d => d.word));
        vis.yScale.domain([0, d3.max(vis.topWords, d => d.count)]);

        vis.xAxis.call(d3.axisBottom(vis.xScale)).selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        vis.yAxis.call(d3.axisLeft(vis.yScale));

        let bars = vis.svg.selectAll(".bar")
            .data(vis.topWords, d => d.word);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => vis.xScale(d.word))
            .attr("y", d => vis.yScale(d.count))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", d => vis.height - vis.yScale(d.count))
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                d3.select(event.target).attr("fill", "orange");
            })
            .on("mouseout", (event, d) => {
                d3.select(event.target).attr("fill", "steelblue");
            });

        bars.transition()
            .duration(500)
            .attr("x", d => vis.xScale(d.word))
            .attr("y", d => vis.yScale(d.count))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", d => vis.height - vis.yScale(d.count));

        bars.exit().remove();
    }
}
