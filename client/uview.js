/* $Id$ */


var ww, wh, c, sNode, data
var ghistory, gjobs, gqueue
var dhistory, djobs, dqueue
var thistory, tjobs, tqueue

function displayAttrs(o) {
	var t = ''
	for (var i in o)
		t += i + ': ' + o[i] + '\n'
		alert(t)
}

function getClip(obj, attr) {
	attr['clip-rect'] =
	    obj.attr('x') + ', ' +
	    obj.attr('y') + ', ' +
	    obj.attr('width') + ', ' +
	    (obj.attr('height')-1) // XXX stroke-width of grid
}

function jobHover(e, j) {
	j.attr({
		'stroke-width': 4,
		opacity: .7
	})
}

function jobUnhover(e, j) {
	j.attr({
		'stroke-width': 6,
		opacity: .7
	})
}

function setVis(name, njobs) {
	var o = document.getElementById(name)
	if (njobs)
		o.style.visibility = 'hidden'
	else
		o.style.visibility = 'visible'
}

function redraw() {
	var i, j, pad, jw, jh, x, y

	pad = 4
	var jattr = {
		fill: "violet",
		stroke: "purple",
		'stroke-width': 4,
		opacity: ".5",
	}

	if (data == null)
		data = {
			result: {
				history: [],
				jobs: [],
				queue: [],
			}
		}

	thistory = data.result.history
	tjobs = data.result.jobs
	tqueue = data.result.queue

	/* history */
	jw = (ghistory.attr('width') - 2*pad) / thistory.length
	x = ghistory.attr('x') + pad
	y = ghistory.attr('y') + ghistory.attr('height')
	getClip(ghistory, jattr)
	for (i in thistory) {
		jh = 100
		c.rect(x+pad, y - jh, jw - 2*pad, jw + pad, pad).attr(jattr)
		x += jw
	}
	setVis('nohistory', thistory.length)

	/* jobs */
	jw = (gjobs.attr('width') - 2*pad) / tjobs.length
	x = gjobs.attr('x') + pad
	y = gjobs.attr('y') + gjobs.attr('height')
	getClip(gjobs, jattr)
	for (i in tjobs) {
		jh = 100
		c.rect(x+pad, y - jh, jw - 2*pad, jh, pad).attr(jattr)
		x += jw
	}
	setVis('nojobs', tjobs.length)

	/* queue */
	jw = gqueue.attr('width') / tqueue.length - 2*pad
	x = gqueue.attr('x')
	y = gqueue.attr('y') + gqueue.attr('height') + 2
	getClip(gqueue, jattr)
	for (i in tqueue) {
		x += pad
		jh = 100
		j = c.rect(x, y - jh, jw, jh, pad)
		j.attr(jattr)
		j.hover(
		    function(e) { jobHover(e, j) },
		    function(e) { jobUnhover(e, j) }
		)
		x += jw + pad
	}
	setVis('noqueue', tqueue.length)

	dhistory = thistory
	djobs = tjobs
	dqueue = tqueue

	window.setTimeout('fetchData()', 5 * 60 * 1000)
}

function fetchData() {
	var newSNode = document.createElement('script')
	newSNode.type = 'text/javascript'
	newSNode.src = 'http://localhost:24240/UView'
	newSNode.onload = redraw
	document.body.replaceChild(newSNode, sNode)
	sNode = newSNode
}

function drawGrid(c, name, x, y, w, h, attr) {
	var obj = c.rect(x, y, w, h).attr(attr)

	var o = document.getElementById(name)
	o.style.left = Math.round(x+w/2 - o.clientWidth/2) + 'px'
	o.style.top = Math.round(y - o.clientHeight) + 'px'

	var o = document.getElementById('no' + name)
	o.style.left = Math.round(x+w/2 - o.clientWidth/2) + 'px'
	o.style.top = Math.round(y+h/2 - o.clientHeight/2) + 'px'

	return (obj)
}

window.onload = function() {
	ww = window.innerWidth
	wh = window.innerHeight
	c = Raphael(0, 0, ww, wh)
	var fs = 30
	var fontAttr = {
		fill: "#fff",
		stroke: "#fff",
		"font-family": "Candara",
		"font-size": fs,
		opacity: 0.9
	}

	var pad = 40
	var sy = wh/5
	var oh = 4*wh/5-sy*2
	var ow = ww/3 - 2*pad
	var attr = {
		"stroke-width": 2,
		"stroke": '#666'
	}

	ghistory = drawGrid(c, 'history', pad, sy, ow, oh, attr)
	gjobs = drawGrid(c, 'jobs', ww/3+pad, sy, ow, oh, attr)
	gqueue = drawGrid(c, 'queue', 2*ww/3+pad, sy, ow, oh, attr)

	sNode = document.createElement('script')
	document.body.appendChild(sNode)

	fetchData()
}
