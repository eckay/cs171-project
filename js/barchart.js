d3.csv("data/bannedBooks.csv").then(function(data) {
    // Step 1: Extract and process the "Reason" column
    let reasons = data.map(d => d.Reason).join(" "); // Combine all reasons into one string
    let stopwords = new Set(["and", "the", "for", "was", "to", "it", "with", "of", "a", "in", "on", "that", "is", "be", "as"]); // Add more as needed

    // Clean and split the words
    let words = reasons
        .toLowerCase() // Convert to lowercase
        .replace(/[.,!?;:()"]/g, "") // Remove punctuation
        .split(/\s+/) // Split by whitespace
        .filter(word => word && !stopwords.has(word)); // Remove stopwords and empty strings

    // Count word occurrences
    let wordCounts = {};
    words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Step 2: Get the top 10 most common words
    let topWords = Object.entries(wordCounts) // Convert to array of [word, count]
        .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
        .slice(0, 10); // Get the top 10 words

    // Prepare data for D3
    let chartData = topWords.map(([word, count]) => ({ word, count }));

    // Step 3: Create the bar chart
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.word))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count)])
        .nice()
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars
    svg.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.word))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "steelblue");

    // Add labels
    svg.selectAll(".label")
        .data(chartData)
        .enter()
        .append("text")
        .attr("x", d => x(d.word) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.count);
});
