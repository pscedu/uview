/* $Id$ */

var winw, winh, canvas, scriptNode, data
var ghistory, gjobs, gqueue
var s_history, s_jobs, s_queue
var s_sysinfo
var fontSize = 30

var gridStrokeWidth = 2
var popupTimeout

function displayAttrs(o, pre) {
	var t = ''
	if (pre)
		t += pre + '\n'
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
	var o = document.getElementById('popup')
	o.style.left = e.pageX + 'px'
	o.style.top = e.pageY + 'px'
	o.innerHTML = '<h3>' + j.Job_Id + '</h3>'
	for (var i in j)
		o.innerHTML += i + ': ' + j[i] + '<br />'
	setVis('popup', 1)
}

function jobUnhover(e, j) {
	j.gobj.attr({
		'stroke-width': 3,
	})
	setVis('popup', 0)
}

function setVis(name, vis) {
	var o = document.getElementById(name)
	if (vis)
		o.style.visibility = 'visible'
	else
		o.style.visibility = 'hidden'
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
	gh = gobj.attr('height') - gridStrokeWidth
	y = gobj.attr('y') + gh + 2*gridStrokeWidth
	getClip(gobj, jattr)
	for (var i in jobs) {
		var j = jobs[i]
		x += pad
		jh = 100
		if (j.MemAlloc)
			jh = gh * j.MemAlloc / s_sysinfo['mem']
		if (jh < fontSize)
			jh = fontSize
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
	setVis('no' + label, jobs.length == 0)
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

function calcMemAlloc(str) {
	var nnodes = 0
	/* 2-9,11-13:16-79,2000-2063 */
	var memNodeList = str.split(/:/)
	if (memNodeList.length == 0)
		return (0)

	/* 2-9,11-13 */
	var sets = memNodeList[0].split(/,/)
	for (var i in sets) {
		/* 2-9 */
		var cpn = sets[i].split(/-/)
		if (cpn.length == 1)
			cpn[1] = cpn[0]
		nnodes += cpn[1] - cpn[0] + 1
	}
	return (nnodes * 64) /* in GB */
}

function calcMem(jobs) {
	for (var i in jobs) {
		var j = jobs[i]
		if (j.Resource_List && 'nodeset' in j.Resource_List)
			j.MemAlloc = calcMemAlloc(j.Resource_List.nodeset)
	}
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
		document.getElementById('title').innerHTML = s_sysinfo.hostname
	}

	calcMem(data.result.history)
	calcMem(data.result.jobs)
	calcMem(data.result.queue)

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
	var pad = 40

	winw = window.innerWidth - pad
	winh = window.innerHeight
	canvas = Raphael(0, 0, winw, winh)
	var fontAttr = {
		fill: "#fff",
		stroke: "#fff",
		"font-family": "Candara",
		"font-size": fontSize,
		opacity: 0.9
	}

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
