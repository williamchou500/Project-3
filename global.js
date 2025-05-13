const pairs = {
    "Eyes closed, VR off: Mozart's Jupiter with loudness shifted at 0.1Hz vs 0.25Hz": [
      "Eyes closed, VR environment off, Mozart's Jupiter with loudness shifted at 0.1Hz",
      "Eyes closed, VR environment off, Mozart's Jupiter with loudness shifted at 0.25Hz"
    ],
    "VR on: unmodified Mozart's Jupiter vs no music": [
      "VR environment on, unmodified Mozart's Jupiter",
      "VR environment on, no music"
    ],
    "VR on: 0.1Hz vs 0.25Hz": [
      "VR environment on, Mozart's Jupiter with loudness shifted at 0.1Hz",
      "VR environment on, Mozart's Jupiter with loudness shifted at 0.25Hz"
    ],
    "VR translating at 0.1Hz: no music vs unmodified Mozart's Jupiter": [
      "VR environment on and moving at 0.1 Hz, no music",
      "VR environment on and moving at 0.1 Hz, unmodified Mozart's Jupiter"
    ],
    "VR translating at 0.1Hz: Mozart's Jupiter with loudness shifted at 0.1Hz vs 0.25Hz": [
      "VR environment on and moving at 0.1 Hz, Mozart's Jupiter with loudness shifted at 0.1Hz",
      "VR environment on and moving at 0.1 Hz, Mozart's Jupiter with loudness shifted at 0.25Hz"
    ],
    "Eyes closed, VR on: unmodified Mozart's Jupiter vs no music": [
      "Eyes closed, VR environment on, unmodified Mozart's Jupiter",
      "Eyes closed, VR environment on, no music"
    ]
  };

  const svg = d3.select("svg");
  const width = +svg.attr("width") - 60;
  const height = +svg.attr("height") - 60;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };

  let xScale = d3.scaleLinear().domain([0, 59]).range([margin.left, width]);
  let yScale = d3.scaleLinear().range([height, margin.top]);

  let line = d3.line()
    .x(d => xScale(+d.Time))
    .y(d => yScale(+d["Overall CoP Displacement"]));

  let allData = {};
  let currentPair = [];
  let animationFrame, step = 0, maxSteps = 60, paused = false;
  let intervalId;

  const color = ['red', 'blue'];

  const start = performance.now();

  // Load CSV and initialize
  d3.csv("swapped.csv").then(data => {
    // Group by Description
    Object.keys(pairs).forEach(pairKey => {
      const [g1, g2] = pairs[pairKey];
      allData[pairKey] = [
        data.filter(d => d.Description === g1),
        data.filter(d => d.Description === g2)
      ];
    });

    initDropdown();
    updateGraph(Object.keys(pairs)[0]);
  });

  function initDropdown() {
    const dropdown = d3.select("#pairSelect");
    dropdown.selectAll("option")
      .data(Object.keys(pairs))
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
    svg.selectAll("*").remove();
    currentPair = allData[pairKey];

    const flatY = currentPair.flat().map(d => +d["Overall CoP Displacement"]);
    yScale.domain([d3.min(flatY), d3.max(flatY)]).nice();

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    svg.append("g").attr("transform", `translate(0,${height})`).call(xAxis);
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

    // Empty lines
    svg.selectAll(".line")
      .data(currentPair)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("stroke", (d, i) => color[i])
      .attr("stroke-width", 2)
      .attr("fill", "none");
  }

   function drawStep(step) {
    svg.selectAll(".line")
      .data(currentPair)
      .attr("d", d => line(d.slice(0, step)));
  }

  function startAnimation() {
    clearInterval(intervalId);
    drawStep(step); // Show first step immediately
    step++;

    intervalId = setInterval(() => {
    if (step > maxSteps || paused) {
        clearInterval(intervalId);
        return;
    }

    drawStep(step);
    step++;
    
    }, 1000);
  }

  document.getElementById("play").onclick = () => {
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
  };

  d3.select("#pairSelect").on("change", function() {
    step = 0;
    clearInterval(intervalId);
    updateGraph(this.value);
  });