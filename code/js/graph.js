var node, link;
var timeStart = new Date().getTime();
var thd1, thd2;
var radius=1000;
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
    bucket = new Int32Array(999999);
  for (var i in node) {
    stat.push(node[i].degree);
    if (node[i].degree > maxx)
      maxx = node[i].degree;
    if (node[i].degree < minx)
      minx = node[i].degree;
    bucket[node[i].degree]++;
  }
  for(var i in link){
    link[i].tid=link[i].target;
    link[i].sid=link[i].source;
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
    left: 50
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
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y));

  /*Brush*/
  var brush = d3.brushX()
    .extent([
      [0, 0],
      [width, height]
    ])
    .on("end", brushmoved);
  g.append("g")
    .attr("class", "brush")
    .call(brush)
   .call(brush.move, x.range());

  function brushmoved() {
    var selection = d3.event.selection;
    thd1 = selection.map(x.invert)[0];
    thd2 = selection.map(x.invert)[1];
    console.log(thd1, thd2);
    graphView();
  }
}

function graphView() {
  /*js是浅复制 神坑*/
    d3.select('svg#canvas').remove();
    var newNode = [];
    var newLink = [];
    for (var i in node) {
      if (node[i].degree >= thd1 && node[i].degree <= thd2)
        newNode.push(node[i]);
    }
    for (var i in link) {
      if (node[link[i].sid].degree >= thd1 &&
        node[link[i].tid].degree >= thd1 &&
        node[link[i].sid].degree <= thd2 &&
        node[link[i].tid].degree <= thd2)
        newLink.push(link[i]);
    }
    console.log("check data",newLink,newNode,link,node);

    var width =parseInt( $("#Graph").css("width")),
      height = parseInt($("#Graph").css("height")),
       svg = d3.select("#Graph").append('svg').attr('id', 'canvas').attr("width",width).attr("height",height);

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) {return d.index;}))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(parseInt($("body").css("width"))/2,parseInt($("body").css("height"))+400));

    var links = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(newLink)
      .enter().append("line");
    var nodes = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(newNode)
      .enter().append("circle")
      .attr("r", 5)
      .attr("fill", "grey")
      .attr("color","grey")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    simulation.nodes(newNode)
      .on("tick", ticked);
    simulation.force("link")
      .links(newLink);

    function ticked() {
      links.attr("x1", function(d) {
          return d.source.x;
        })
        .attr("y1", function(d) {
          return d.source.y;
        })
        .attr("x2", function(d) {
          return d.target.x;
        })
        .attr("y2", function(d) {
          return d.target.y;
        });

      nodes.attr("cx", function(d) {
        return d.x;
        // return (d.x = Math.min(radius, Math.min(width - radius, d.x)));
        })
        .attr("cy", function(d) {
         return d.y;
      // return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
        });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }




  var timeEnd = new Date().getTime();
  console.log("total time =", (timeEnd - timeStart) / 1000, "s");
