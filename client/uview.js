/* $Id$ */

var winw, winh, canvas, scriptNode, data
var ghistory, gjobs, gqueue
var s_history, s_jobs, s_queue
var s_sysinfo

var gridStrokeWidth = 2

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
	    (obj.attr('height')- gridStrokeWidth/2)
}

function jobHover(e, j) {
	j.gobj.attr({
		'stroke-width': 6,
	})
}

function jobUnhover(e, j) {
	j.gobj.attr({
		'stroke-width': 3,
	})
}

function setVis(name, njobs) {
	var o = document.getElementById(name)
	if (njobs)
		o.style.visibility = 'hidden'
	else
		o.style.visibility = 'visible'
}

function drawJobs(label, gobj, jobs) {
	var jw, jh, x, y

	var pad = 4
	var jattr = {
		fill: "violet",
		stroke: "purple",
		'stroke-width': 3,
		opacity: ".7",
	}

	jw = (gobj.attr('width') - gridStrokeWidth - 2*pad) / jobs.length - 2*pad
	x = gobj.attr('x') + gridStrokeWidth/2 + pad
	y = gobj.attr('y') + gobj.attr('height') + gridStrokeWidth
	getClip(gobj, jattr)
	for (var i in jobs) {
		var j = jobs[i]
		x += pad
		jh = 100
		if (j.gobj) {
		} else {
			j.gobj = canvas.rect(x, y - jh, jw, jh, pad);
			(function(j) {
				j.gobj.attr(jattr).hover(
				    function(e) { jobHover(e, j) },
				    function(e) { jobUnhover(e, j) }
				)
			})(j)
		}
		x += jw + pad
	}
	setVis('no' + label, jobs.length)
}

function jobsPersist(savedata, newdata, cb) {
	for (var i in savedata) {
		var found = 0
		for (var k in newdata) {
			if (savedata[i].Job_Id == newdata[k].Job_Id) {
				found = 1
				break
			}
		}
		if (!found)
			cb(savedata[i])
	}
}

function clearJob(j) {
	//j.gobj.animate()
	//delete j
}

function moveJob(j) {
}

function boreJob(j) {
}

function redraw() {
	if (data == null)
		data = {
			result: {
				history: [],
				jobs: [],
				queue: [],
				sysinfo: [],
			}
		}

	if (s_sysinfo == null && data.result.sysinfo) {
		s_sysinfo = data.result.sysinfo
		$('#title').innerHTML = s_sysinfo.hostname
	}

	// prune history
	jobsPersist(s_history, data.result.history, clearJob)
	// jobs -> history
	jobsPersist(s_jobs, data.result.jobs, moveJob)
	// queue -> jobs
	jobsPersist(s_queue, data.result.queue, moveJob)
	// newly queued
	jobsPersist(data.result.queue, s_queue, boreJob)

	drawJobs('queue', gqueue, data.result.queue)
	drawJobs('jobs', gjobs, data.result.jobs)
	drawJobs('history', ghistory, data.result.history)

	s_history = data.result.history
	s_jobs = data.result.jobs
	s_queue = data.result.queue

	window.setTimeout('fetchData()', 5 * 60 * 1000)
}

function fetchData() {
	var newSNode = document.createElement('script')
	newSNode.type = 'text/javascript'
	newSNode.src = 'http://localhost:24240/UView'
	newSNode.onload = redraw
	document.body.replaceChild(newSNode, scriptNode)
	scriptNode = newSNode
}

function drawGrid(name, x, y, w, h, attr) {
	var obj = canvas.rect(x, y, w, h).attr(attr)

	var o = document.getElementById(name)
	o.style.left = Math.round(x+w/2 - o.clientWidth/2) + 'px'
	o.style.top = Math.round(y - o.clientHeight) + 'px'

	var o = document.getElementById('no' + name)
	o.style.left = Math.round(x+w/2 - o.clientWidth/2) + 'px'
	o.style.top = Math.round(y+5*h/6 - o.clientHeight/2) + 'px'

	return (obj)
}

window.onload = function() {
	winw = window.innerWidth
	winh = window.innerHeight
	canvas = Raphael(0, 0, winw, winh)
	var fs = 30
	var fontAttr = {
		fill: "#fff",
		stroke: "#fff",
		"font-family": "Candara",
		"font-size": fs,
		opacity: 0.9
	}

	var pad = 40
	var sy = winh/5
	var oh = 4*winh/5-sy*2
	var ow = winw/3 - 2*pad
	var attr = {
		"stroke-width": gridStrokeWidth,
		"stroke": '#666'
	}

	gqueue = drawGrid('queue', pad, sy, ow, oh, attr)
	gjobs = drawGrid('jobs', winw/3+pad, sy, ow, oh, attr)
	ghistory = drawGrid('history', 2*winw/3+pad, sy, ow, oh, attr)

	scriptNode = document.createElement('script')
	document.body.appendChild(scriptNode)

	fetchData()
}
