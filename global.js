const response = await fetch('./body_sway_data_small.json');
const flatData = await response.json();

const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const sampleSelect = d3.select("#sampleSelect");
const experimentSelect = d3.select("#experimentSelect");
const forwardButton = d3.select("#forwardButton");
const backButton = d3.select("#backButton");
const timeDisplay = d3.select("#timeDisplay");

const linesGroup = svg.append("g");
const dot = svg.append("circle").attr("r", 5).attr("fill", "blue");

const xExtent = d3.extent(flatData, d => d.CoPx);
const yExtent = d3.extent(flatData, d => d.CoPy);

const xScale = d3.scaleLinear()
  .domain(xExtent)
  .range([50, width - 50]);

const yScale = d3.scaleLinear()
  .domain(yExtent)
  .range([height - 50, 50]);

const groupedData = d3.group(flatData, d => d.Sample, d => d.Description);

const samples = Array.from(groupedData.keys());
sampleSelect.selectAll("option")
  .data(samples)
  .enter().append("option")
  .attr("value", d => d)
  .text(d => d);

let currentIndex = 0;
let currentPoints = [];
let prevPoint = null;
let drawnLines = [];

function updateExperiments() {
  const selectedSample = sampleSelect.property("value");
  const experiments = Array.from(groupedData.get(selectedSample).keys());
  experimentSelect.selectAll("option").remove();
  experimentSelect.selectAll("option")
    .data(experiments)
    .enter().append("option")
    .attr("value", d => d)
    .text(d => d);
}

function getCurrentPoints() {
  const sample = sampleSelect.property("value");
  const experiment = experimentSelect.property("value");
  return groupedData.get(sample)?.get(experiment);
}

function drawLine(from, to, color) {
  const line = linesGroup.append("line")
    .attr("x1", xScale(from.CoPx))
    .attr("y1", yScale(from.CoPy))
    .attr("x2", xScale(to.CoPx))
    .attr("y2", yScale(to.CoPy))
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .lower();
  return line;
}

function updateDot(point) {
  dot.transition()
    .duration(200)
    .attr("cx", xScale(point.CoPx))
    .attr("cy", yScale(point.CoPy));
}

function stepForward() {
  if (currentIndex >= currentPoints.length - 1) {
    dot.attr("visibility", "hidden");
    return;
  };

  const from = currentPoints[currentIndex];
  const to = currentPoints[currentIndex + 1];

  const line = drawLine(from, to, "red");

  drawnLines.forEach(l => l.attr("stroke", "gray"));
  drawnLines.push(line);

  currentIndex += 1;
  updateDot(to);
  timeDisplay.text(`${to.Time.toFixed(2)}s`);
  prevPoint = to;
}

function stepBack() {
  if (currentIndex <= 0) return;

  drawnLines.pop()?.remove();
  currentIndex -= 1;

  const point = currentPoints[currentIndex];
  updateDot(point);
  timeDisplay.text(`${point.Time.toFixed(2)}s`);
  prevPoint = point;
}

function reset() {
  currentPoints = getCurrentPoints();
  if (!currentPoints || currentPoints.length === 0) return;

  linesGroup.selectAll("*").remove();
  drawnLines = [];
  currentIndex = 0;

  const startPoint = currentPoints[0];
  updateDot(startPoint);
  timeDisplay.text("0.00s");
  prevPoint = startPoint;
}

sampleSelect.on("change", () => {
  updateExperiments();
  reset();
});

experimentSelect.on("change", reset);
forwardButton.on("click", stepForward);
backButton.on("click", stepBack);

const resetButton = d3.select("#resetButton");

resetButton.on("click", () => {
  const points = getCurrentPoints();
  if (!points || points.length === 0) return;

  linesGroup.selectAll("*").remove();
  drawnLines = [];
  currentIndex = 0;

  const start = points[0];
  timeDisplay.text(`${start.Time.toFixed(2)}s`);

  dot
    .interrupt()
    .attr("cx", xScale(start.CoPx))
    .attr("cy", yScale(start.CoPy))
    .attr("visibility", "visible"); // Show the dot again
});

updateExperiments();
reset();