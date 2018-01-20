var node, link;
var timeStart = new Date().getTime();
var getData = function(file) {
  console.log(file)
  /*Clear data before*/
  d3.selectAll("svg").remove();
  d3.json(file, function(error, data) {
    node = data[0]['node'];
    link = data[0]['link'];
    barChartView();
  })
}

function barChartView() {
  /* Get the indice (here use degree distribution)*/
  var maxx = 0,
    minx = 999999,
    delta = 0,
    maxy = 0;
  var degree = [],
    count = [];
  var stat = [];
  var cut = [],
    height = [],
    bucket = new Int32Array(99999);
  for (var i in node) {
    stat.push(node[i].degree);
    if (node[i].degree > maxx)
      maxx = node[i].degree;
    if (node[i].degree < minx)
      minx = node[i].degree;
    bucket[node[i].degree]++;
  }
  for (var i = minx; i <= maxx; ++i)
    if (bucket[i] != 0) {
      degree.push(i);
      count.push(bucket[i]);
      if (bucket[i] > maxy)
        maxy = bucket[i];
    }
  /*Draw the histogram of degree distribution */
  /* Axis & Scale*/
  var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 30
  };
  var height = parseInt($("#barChart").css("height")) - margin.top - margin.bottom,
    width = parseInt($("#barChart").css("width")) - margin.left - margin.right;
  var svg = d3.select("#barChart")
    .append("svg")
    .attr("width", $("#barChart")
      .css("width"))
    .attr("height", $("#barChart").css("height"));
  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var x = d3.scaleLog()
    .rangeRound([0, width])
    .domain([minx, maxx]);
  var bins = d3.histogram()
    .domain([minx, maxx])
    .thresholds(x.ticks(30))(stat);
  console.log(bins);
  var y = d3.scaleLinear()
    .domain([0, d3.max(bins, function(d) {
      return d.length;
    })])
    .range([height, 0]);
  var bar = g.selectAll(".bar")
    .data(bins)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", function(d) {
      return "translate(" + x(d.x0) + "," + y(d.length) + ")";
    });
  bar.append("rect")
    .attr("x", 1)
    .attr("width", function(d) {
      return (x(d.x1) - x(d.x0)) - 1;
    })
    .attr("height", function(d) {
      return height - y(d.length);
    });
  bar.append("text")
    .attr("dy", ".75em")
    .attr("y", -10)
    .attr("x", function(d, i) {
      return (x(bins[i].x1) - x(bins[i].x0) - 1.6) / 2;
    })
    .attr("text-anchor", "middle")
    .text(function(d) {
      return d.length;
    });
  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")") //再加个坐标轴注释
    .call(d3.axisBottom(x).tickFormat(function(d) {
      return x.tickFormat(15, d3.format(",d"))(d)
    }));
  g.append("g")
  .attr("class","axis axis--y")
  .call(d3.axisLeft(y));

  /*Brush*/
  var brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("start brush end", brushmoved);
    console.log("hahaha",width,height);
  var gBrush = g.append("g")
    .attr("class", "brush")
    .call(brush.move,x.range());

  function brushmoved() {
console.log("hahahhahahahahha");
  }









  var timeEnd = new Date().getTime();
  console.log("total time =", (timeEnd - timeStart) / 1000, "s");
}
