    const svg1 = d3.select("#svg1");
    const width1 = +svg1.attr("width");
    const height1 = +svg1.attr("height");
    const centerX1 = width1 / 4;
    const centerX2 = (3 * width1) / 4;
    const baseY = height1 / 2 + 150;
    const swayScaleX = 8000;
    const swayScaleY = 2000;

    let data = [], animationTimer, currentIndex = 0, swayData1 = [], swayData2 = [], isPlaying = false;

    const body1 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 10);
    const head1 = svg1.append("circle").attr("r", 30).attr("fill", "black");
    const leftArm1 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 6);
    const rightArm1 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 6);
    const leftLeg1 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 10);
    const rightLeg1 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 10);

    const body2 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 10);
    const head2 = svg1.append("circle").attr("r", 30).attr("fill", "black");
    const leftArm2 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 6);
    const rightArm2 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 6);
    const leftLeg2 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 10);
    const rightLeg2 = svg1.append("line").attr("stroke", "black").attr("stroke-width", 10);

    const base1 = svg1.append("line").attr("stroke", "red").attr("stroke-width", "5")
    const base2 = svg1.append("line").attr("stroke", "blue").attr("stroke-width", "5")

    const hoverZone1 = svg1.append("rect")
      .attr("width", 200)
      .attr("height", 250)
      .attr("fill", "transparent")
      .style("cursor", "pointer");

    const hoverZone2 = svg1.append("rect")
      .attr("width", 200)
      .attr("height", 250)
      .attr("fill", "transparent")
      .style("cursor", "pointer");

    const gpairs = {
    'Mozart vs No Music\nEyes Closed, VR On': [
        "Eyes closed, VR environment on, unmodified Mozart's Jupiter",
        "Eyes closed, VR environment on, no music"
    ], // ECR vs. ECN

    "0.1Hz vs 0.25Hz Mozart\nEyes Closed, No VR": [
        "Eyes closed, VR environment off, Mozart's Jupiter with loudness shifted at 0.1Hz",
        "Eyes closed, VR environment off, Mozart's Jupiter with loudness shifted at 0.25Hz"
    ], // ECL1 vs. ECL2

    "Mozart vs No Music\nVR On": [
        "VR environment on, unmodified Mozart's Jupiter",
        "VR environment on, no music"
    ], // WOR vs. WON

    "0.1Hz vs 0.25Hz Mozart\nVR On": [
        "VR environment on, Mozart's Jupiter with loudness shifted at 0.1Hz",
        "VR environment on, Mozart's Jupiter with loudness shifted at 0.25Hz"
    ], // WOL1 vs. WOL2

    "No Music vs Mozart\nVR Moving at 0.1Hz": [
        "VR environment on and moving at 0.1 Hz, no music",
        "VR environment on and moving at 0.1 Hz, unmodified Mozart's Jupiter"
    ], // WN vs. WR

    "0.1Hz vs 0.25Hz Mozart\nVR Moving at 0.1Hz": [
        "VR environment on and moving at 0.1 Hz, Mozart's Jupiter with loudness shifted at 0.1Hz",
        "VR environment on and moving at 0.1 Hz, Mozart's Jupiter with loudness shifted at 0.25Hz"
    ] // WL1 vs. WL2
    };

    const pairs = Object.entries(gpairs).map(([label, categories]) => ({ label, categories }));

    let currentPairIndex = 0;

    d3.csv("data/fin_swapped.csv").then(csv => {
    csv.forEach(d => {
        d.CoPx = +d.CoPx;
        d.CoPy = +d.CoPy;
    });
    data = csv;
    
    // Initialize with first pair
    updateSwayData();
    updatePairLabel();
    drawCurrentFigures();
    });

    // Function to navigate to the previous pair
    function navigateToPreviousPair() {
    currentPairIndex = (currentPairIndex - 1 + pairs.length) % pairs.length;
    const selectedLabel = pairs[currentPairIndex].label;
    
    // Update the human figures
    updateSwayData();
    updatePairLabel();
    drawCurrentFigures();
    
    // Update the line graph
    step = 0;
    clearInterval(intervalId);
    updateGraph(selectedLabel);
    }

    // Function to navigate to the next pair
    function navigateToNextPair() {
    currentPairIndex = (currentPairIndex + 1) % pairs.length;
    const selectedLabel = pairs[currentPairIndex].label;
    
    // Update the human figures
    updateSwayData();
    updatePairLabel();
    drawCurrentFigures();
    
    // Update the line graph
    step = 0;
    clearInterval(intervalId);
    updateGraph(selectedLabel);
    }

    // Add event listeners for the arrows
    document.getElementById("leftArrow").addEventListener("click", navigateToPreviousPair);
    document.getElementById("rightArrow").addEventListener("click", navigateToNextPair);

    const reverseGpairs = {};
    Object.entries(gpairs).forEach(([label, cats]) => {
    reverseGpairs[cats.join("|")] = label;
    });

    const svg2 = d3.select("#svg2");
    const width2 = +svg2.attr("width") - 60;
    const height2 = +svg2.attr("height") - 60;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };

    let xScale = d3.scaleLinear().domain([0, 59]).range([margin.left, width2]);
    let yScale = d3.scaleLinear().range([height2, margin.top]);

    let line = d3.line()
        .x(d => xScale(+d.Time))
        .y(d => yScale(+d["Overall CoP Displacement"]));

    let allData = {};
    let currentPair = [];
    let animationFrame, step = 0, maxSteps = 60, paused = false;
    let intervalId;

    const color = ['red', 'blue'];

    const start = performance.now();

    let convert_descriptions = new Map();

    convert_descriptions.set("Eyes closed, VR environment off, Mozart's Jupiter with loudness shifted at 0.1Hz", 'ECL1');
    convert_descriptions.set("Eyes closed, VR environment off, Mozart's Jupiter with loudness shifted at 0.25Hz", 'ECL2');
    convert_descriptions.set("Eyes closed, VR environment on, unmodified Mozart's Jupiter", 'ECR');
    convert_descriptions.set("Eyes closed, VR environment on, no music", 'ECN');
    convert_descriptions.set("VR environment on and moving at 0.1 Hz, Mozart's Jupiter with loudness shifted at 0.1Hz", 'WL1');
    convert_descriptions.set("VR environment on and moving at 0.1 Hz, Mozart's Jupiter with loudness shifted at 0.25Hz", 'WL2');
    convert_descriptions.set("VR environment on and moving at 0.1 Hz, no music", 'WN');
    convert_descriptions.set("VR environment on and moving at 0.1 Hz, unmodified Mozart's Jupiter", 'WR');
    convert_descriptions.set("VR environment on, Mozart's Jupiter with loudness shifted at 0.1Hz", 'WOL1');
    convert_descriptions.set("VR environment on, Mozart's Jupiter with loudness shifted at 0.25Hz", 'WOL2');
    convert_descriptions.set("VR environment on, no music", 'WON');
    convert_descriptions.set("VR environment on, unmodified Mozart's Jupiter", 'WOR');

    let animationSpeedFactor = 10;

    d3.csv("data/swapped.csv").then(data => {
    
        Object.keys(gpairs).forEach(pairKey => {
        const [g1, g2] = gpairs[pairKey];
        allData[pairKey] = [
            data.filter(d => d.Description === g1),
            data.filter(d => d.Description === g2)
        ];
        });

        initDropdown();
        updateGraph(Object.keys(gpairs)[0]);
    });

    function updatePairLabel() {
    const selectedPairLabel = pairs[currentPairIndex].label;
    document.getElementById('pairLabel').textContent = selectedPairLabel;
    d3.select("#pairSelect").property("value", selectedPairLabel); // Sync dropdown
    }

    function updateSwayData() {
    const selectedPair = pairs[currentPairIndex].categories;
    swayData1 = data.filter(d => d.Description === convert_descriptions.get(selectedPair[0]));
    swayData2 = data.filter(d => d.Description === convert_descriptions.get(selectedPair[1]));
    clearInterval(animationTimer);
    currentIndex = 0;
    }

    function drawHuman(centerX, offsetX, offsetY, body, head, leftArm, rightArm, leftLeg, rightLeg, hoverZone, base) {
      const torsoTopX = centerX + offsetX;
      const torsoTopY = baseY - 120 + offsetY;
      const torsoBottomX = centerX;
      const torsoBottomY = baseY;

      body.attr("x1", torsoBottomX).attr("y1", torsoBottomY)
          .attr("x2", torsoTopX).attr("y2", torsoTopY);

      head.attr("cx", torsoTopX).attr("cy", torsoTopY - 35);

      leftArm.attr("x1", torsoTopX).attr("y1", torsoTopY)
             .attr("x2", torsoTopX - 60).attr("y2", torsoTopY + 40);

      rightArm.attr("x1", torsoTopX).attr("y1", torsoTopY)
              .attr("x2", torsoTopX + 60).attr("y2", torsoTopY + 40);

      leftLeg.attr("x1", centerX - 20).attr("y1", baseY + 80)
             .attr("x2", centerX).attr("y2", baseY);

      rightLeg.attr("x1", centerX + 20).attr("y1", baseY + 80)
              .attr("x2", centerX).attr("y2", baseY);

      hoverZone.attr("x", torsoTopX - 60)
               .attr("y", torsoTopY - 60);

      base.attr("x1", centerX - 50).attr("y1", baseY + 90)
          .attr("x2", centerX + 50).attr("y2", baseY + 90)     
    }

    function drawCurrentFigures() {
      if (swayData1.length > 0 && swayData2.length > 0) {
        const d1 = swayData1[0];
        const d2 = swayData2[0];

        const offsetX1 = d1.CoPx * swayScaleX;
        const offsetY1 = -d1.CoPy * swayScaleY;

        const offsetX2 = d2.CoPx * swayScaleX;
        const offsetY2 = -d2.CoPy * swayScaleY;

        drawHuman(centerX1, offsetX1, offsetY1, body1, head1, leftArm1, rightArm1, leftLeg1, rightLeg1, hoverZone1, base1);
        drawHuman(centerX2, offsetX2, offsetY2, body2, head2, leftArm2, rightArm2, leftLeg2, rightLeg2, hoverZone2, base2);
      }
    }

    function animateHumans() {
      clearInterval(animationTimer);
      animationTimer = setInterval(() => {
        if (currentIndex >= swayData1.length || currentIndex >= swayData2.length) {
        return;
        }

        const d1 = swayData1[currentIndex];
        const d2 = swayData2[currentIndex];

        const offsetX1 = d1.CoPx * swayScaleX;
        const offsetY1 = -d1.CoPy * swayScaleY;

        const offsetX2 = d2.CoPx * swayScaleX;
        const offsetY2 = -d2.CoPy * swayScaleY;

        drawHuman(centerX1, offsetX1, offsetY1, body1, head1, leftArm1, rightArm1, leftLeg1, rightLeg1, hoverZone1, base1);
        drawHuman(centerX2, offsetX2, offsetY2, body2, head2, leftArm2, rightArm2, leftLeg2, rightLeg2, hoverZone2, base2);

        currentIndex++;
      }, 1000 / animationSpeedFactor);
    }

    const tooltip = d3.select("#tooltip");

    function calculateAverageSway(data) {
      if (data.length === 0) return 0;
      let sum = 0;
      data.forEach(d => {
        sum += parseFloat(d['Overall CoP Displacement']);
      });
      return (sum / data.length).toFixed(2);
    }

    hoverZone1.on("mouseover", () => {
      const selectedPair = pairs[currentPairIndex].categories;
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>Condition:</strong> ${selectedPair[0]}<br><strong>Average Sway:</strong> ${calculateAverageSway(currentPair[0])} mm`)
             .style("left", (centerX1 - 70) + "px")
             .style("top", (baseY - 50) + "px");
    }).on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    });

    hoverZone2.on("mouseover", () => {
      const selectedPair = pairs[currentPairIndex].categories;
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>Condition:</strong> ${selectedPair[1]}<br><strong>Average Sway:</strong> ${calculateAverageSway(currentPair[1])} mm`)
             .style("left", (centerX2 - 70) + "px")
             .style("top", (baseY - 50) + "px");
    }).on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    });

    function initDropdown() {
        const dropdown = d3.select("#pairSelect");
        dropdown.selectAll("option")
        .data(Object.keys(gpairs))
        .enter()
        .append("option")
        .text(d => d);

        dropdown.on("change", function() {
        step = 0;
        cancelAnimationFrame(animationFrame);
        updateGraph(this.value);

        });
    }

    function updateGraph(pairKey) {
        svg2.selectAll("*").remove();
        currentPair = allData[pairKey];

        const flatY = currentPair.flat().map(d => +d["Overall CoP Displacement"]);
        yScale.domain([d3.min(flatY) - 0.0001, d3.max(flatY) + 0.0001]);

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        // Add X axis
        svg2.append("g")
            .attr("transform", `translate(0,${height2})`)
            .call(xAxis)
            .append("text") // X axis label
            .attr("class", "axis-label")
            .attr("x", width2 / 2)
            .attr("y", 35)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Time (seconds)");

        // Add Y axis
        svg2.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis)
            .append("text") // Y axis label
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height2 / 2)
            .attr("y", -40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Displacement from Origin (mm)");

        
        svg2.selectAll(".line")
        .data(currentPair)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("stroke", (d, i) => color[i])
        .attr("stroke-width", 2)
        .attr("fill", "none");

    
        const legendContainer = d3.select("#legend");
        legendContainer.html("")
            .style("display", "flex")
            .style("flex-direction", "row")
            .style("gap", "8px")
            .style("width", "500px")
            .style("margin", "auto")
            .style("margin-top", "20px");

        const labels = gpairs[pairKey];

        // Create a consistent style for all legend items
        const legendItem = legendContainer.selectAll(".legend-item")
            .data(labels)
            .enter()
            .append("div")
            .attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "8px");

        // Add consistent color squares
        legendItem.append("div")
            .attr("class", "legend-color")
            .style("width", "16px")
            .style("height", "16px")
            .style("background-color", (d, i) => color[i])
            .style("border-radius", "2px")
            .style("flex-shrink", "0");

        // Add consistent text
        legendItem.append("div")
            .attr("class", "legend-text")
            .text(d => d)
            .style("font-size", "14px")
            .style("line-height", "1.2");
    }

    function drawStep(step) {
        svg2.selectAll(".line")
        .data(currentPair)
        .attr("d", d => line(d.slice(0, step)));
        console.log(currentPair);
    }

    function startAnimation() {
        clearInterval(intervalId);
        drawStep(step);
        step++;

        intervalId = setInterval(() => {
        if (step > maxSteps || paused) {
            clearInterval(intervalId);
            return;
        }

        drawStep(step);
        step++;

        }, 1000 / animationSpeedFactor);
    }

    document.getElementById("play").onclick = () => {
    if (step >= maxSteps) {
        step = 0;
        drawStep(step + 1);
        step++;
    }
    paused = false;
    startAnimation();
    };

    document.getElementById("pause").onclick = () => {
        paused = true;
        clearInterval(intervalId);
    };

    document.getElementById("restart").onclick = () => {
        step = 0;
        paused = false;
        clearInterval(intervalId);
        drawStep(0);
        startAnimation();
    };

    document.getElementById("skip").onclick = () => {
    clearInterval(intervalId);
    drawStep(maxSteps);
    step = maxSteps; 
    };


    document.getElementById("play").onclick = () => {
    isPlaying = true;
    if (step >= maxSteps) {
        step = 0;
        currentIndex = 0;
    }
    paused = false;
    animateHumans();
    startAnimation();
    };

    document.getElementById("pause").onclick = () => {
    isPlaying = false;
    paused = true;
    clearInterval(animationTimer);
    clearInterval(intervalId);
    };

    document.getElementById("restart").onclick = () => {
    step = 0;
    currentIndex = 0;
    paused = false;
    isPlaying = true;
    clearInterval(animationTimer);
    clearInterval(intervalId);
    drawStep(0);
    drawCurrentFigures();
    startAnimation();
    animateHumans();
    };

    document.getElementById("skip").onclick = () => {
    clearInterval(intervalId);
    clearInterval(animationTimer);
    drawStep(maxSteps);
    step = maxSteps;
    currentIndex = Math.max(swayData1.length, swayData2.length) - 1;
    drawCurrentFigures();
    };

    d3.select("#speedSelect").on("change", function () {
    animationSpeedFactor = parseFloat(this.value);

    if (isPlaying) {
        // Restart animations with the new speed
        clearInterval(animationTimer);
        clearInterval(intervalId);
        animateHumans();
        startAnimation();
    }
    });