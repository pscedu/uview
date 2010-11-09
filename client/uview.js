/* $Id$ */

var winw, winh, canvas, scriptNode, data
var ghistory, gjobs, gqueue
var s_history, s_jobs, s_queue
var s_sysinfo
var fontSize = 30
var popJob

var gridStrokeWidth = 2
var popupTimeout
var animTime = 1000

function strAttrs(o, pre) {
	var t = ''
	for (var i in o) {
		try {
			t += pre + i + ': ' + o[i] + '\n'
		} catch (e) {
			t += pre + i + ': ' + '?'
		}
	}
	return (t)
}

function displayAttrs(o, pre) {
	var s = strAttrs(o, '')
	if (pre)
		s = pre + '\n' + s
	alert(s)
}

function getClip(obj, attr) {
	attr['clip-rect'] =
	    obj.attr('x') + ', ' +
	    obj.attr('y') + ', ' +
	    obj.attr('width') + ', ' +
	    (obj.attr('height')- gridStrokeWidth/2)
}

var colors = [
	[ 0	, 0	, 127	],
	[ 0	, 0	, 191	],
	[ 0	, 0	, 255	],
	[ 0	, 63	, 127	],
	[ 0	, 63	, 191	],
	[ 0	, 63	, 255	],
	[ 0	, 127	, 0	],
	[ 0	, 127	, 63	],
	[ 0	, 127	, 127	],
	[ 0	, 127	, 191	],
	[ 0	, 127	, 255	],
	[ 0	, 191	, 0	],
	[ 0	, 191	, 63	],
	[ 0	, 191	, 127	],
	[ 0	, 191	, 191	],
	[ 0	, 191	, 255	],
	[ 0	, 255	, 0	],
	[ 0	, 255	, 63	],
	[ 0	, 255	, 127	],
	[ 0	, 255	, 191	],
	[ 63	, 0	, 127	],
	[ 63	, 0	, 191	],
	[ 63	, 0	, 255	],
	[ 63	, 63	, 127	],
	[ 63	, 63	, 191	],
	[ 63	, 63	, 255	],
	[ 63	, 127	, 0	],
	[ 63	, 127	, 63	],
	[ 63	, 127	, 127	],
	[ 63	, 127	, 191	],
	[ 63	, 127	, 255	],
	[ 63	, 191	, 0	],
	[ 63	, 191	, 63	],
	[ 63	, 191	, 127	],
	[ 63	, 191	, 191	],
	[ 63	, 255	, 0	],
	[ 63	, 255	, 63	],
	[ 63	, 255	, 127	],
	[ 127	, 0	, 0	],
	[ 127	, 0	, 63	],
	[ 127	, 0	, 127	],
	[ 127	, 0	, 191	],
	[ 127	, 0	, 255	],
	[ 127	, 63	, 0	],
	[ 127	, 63	, 63	],
	[ 127	, 63	, 127	],
	[ 127	, 63	, 191	],
	[ 127	, 63	, 255	],
	[ 127	, 127	, 0	],
	[ 127	, 127	, 63	],
	[ 127	, 127	, 191	],
	[ 127	, 191	, 0	],
	[ 127	, 191	, 63	],
	[ 127	, 191	, 127	],
	[ 127	, 255	, 0	],
	[ 127	, 255	, 63	],
	[ 191	, 0	, 0	],
	[ 191	, 0	, 63	],
	[ 191	, 0	, 127	],
	[ 191	, 0	, 191	],
	[ 191	, 0	, 255	],
	[ 191	, 63	, 0	],
	[ 191	, 63	, 63	],
	[ 191	, 63	, 127	],
	[ 191	, 63	, 191	],
	[ 191	, 127	, 0	],
	[ 191	, 127	, 63	],
	[ 191	, 127	, 127	],
	[ 191	, 191	, 0	],
	[ 191	, 191	, 63	],
	[ 191	, 255	, 0	],
	[ 255	, 0	, 63	],
	[ 255	, 0	, 127	],
	[ 255	, 0	, 191	],
	[ 255	, 63	, 0	],
	[ 255	, 63	, 63	],
	[ 255	, 63	, 127	],
	[ 255	, 127	, 0	],
	[ 255	, 127	, 63	],
	[ 255	, 191	, 0	],
]

var colIdx = 0
function getCol() {
	if (colIdx >= colors.length)
		colIdx = 0
	var c = colors[colIdx]
	colIdx += 7
	return (c)
}

function getPopupPos(figx, figw, dispw, max, prefBefore) {
	var pad = 6
	var res = figx + figw - pad
	if (res + dispw < max)
		return (res)
	res = figx - dispw
	if (res > 0)
		return (res)
	if (prefBefore)
		return (0)
	return (max - dispw - 15)
}

function jobHover(e, j) {
	j.gobj.attr({
		'stroke-width': 6,
	})
	var o = document.getElementById('popup')
	o.innerHTML = '<h3>' +
	    '<div style="background-color: '+toHexColor(j.Color)+'; ' +
	    'border: 2px solid '+toHexColor(j.StrokeColor)+'"></div>' +
	    j.Job_Id + '</h3>' + strAttrs(j, '').replace(/\n/g, '<br />')

	o.style.left = getPopupPos(j.gobj.attr('x'),
	    j.gobj.attr('width'), o.clientWidth, winw, 0) + 'px'
	o.style.top = getPopupPos(j.gobj.attr('y'),
	    j.gobj.attr('height'), o.clientHeight, winh, 1) + 'px'

	if (popupTimeout && (popJob == j || popJob == null)) {
		window.clearTimeout(popupTimeout)
		popupTimeout = null
	} else {
		if (popJob) {
			window.clearTimeout(popupTimeout)
			clearPopup()
		}
		setVis('popup', 1)
		popJob = j
	}
}

function clearPopup() {
	popupTimeout = null
	popJob.gobj.attr({
		'stroke-width': 3,
	})
	popJob = null
	setVis('popup', 0)
}

function jobUnhover(e, j) {
	popupTimeout = window.setTimeout('clearPopup()', 100)
}

function setVis(name, vis) {
	var o = document.getElementById(name)
	if (vis)
		o.style.visibility = 'visible'
	else
		o.style.visibility = 'hidden'
}

function animWithObj(syncObj, obj, attr, time) {
	attr.easing = '>'
//	if (syncObj)
//		obj.animateWith(syncObj, attr, time)
//	else {
		obj.animate(attr, time)
//		syncObj = obj
//	}
//	return (syncObj)
}

function toHexColor(rgb) {
	var s = '#'
	for (var j = 0; j < 3; j++) {
		var n = rgb[j].toString(16)
		if (n < 0x10)
			s += '0'
		s += n
	}
	return (s)
}

function strokeShade(orgb) {
	return [
		Math.round(orgb[0] * .6),
		Math.round(orgb[1] * .6),
		Math.round(orgb[2] * .6)
	]
}

function drawJobs(syncObj, label, grid, jobs) {
	var jw, jh, x, y

	var pad = 4

	var gridX = Math.round(grid.attr('x'))
	var gridY = Math.round(grid.attr('y'))
	var gridH = Math.round(grid.attr('height')) - gridStrokeWidth

	jw = (grid.attr('width') - gridStrokeWidth -
	    2*pad) / jobs.length - 2*pad
	x = gridX + Math.round(gridStrokeWidth/2) + pad
	y = gridY + gridH + 2*gridStrokeWidth
	for (var i in jobs) {
		var j = jobs[i]
		x += pad
		jh = 100
		if (j.MemAlloc)
			jh = gridH * j.MemAlloc / s_sysinfo['mem']
		if (jh < fontSize)
			jh = fontSize

		if (!('gobj' in j)) {
			j.Color = getCol()
			j.StrokeColor = strokeShade(j.Color)
			var jattr = {
				fill: toHexColor(j.Color),
				stroke: toHexColor(j.StrokeColor),
				'stroke-width': 3,
				opacity: ".7",
			}
			getClip(grid, jattr)
			j.gobj = canvas.rect(gridX, gridY+gridH, 0, 0, pad);
			(function(j) {
				j.gobj.attr(jattr).hover(
				    function(e) { jobHover(e, j) },
				    function(e) { jobUnhover(e, j) }
				)
			})(j)
		}

		syncObj = animWithObj(syncObj, j.gobj, {
			x: x,
			y: y - jh,
			width: Math.round(jw),
			height: jh,
		}, animTime)

		x += jw + pad

		if (syncObj == null)
			syncObj = j
	}
	setVis('no' + label, jobs.length == 0)
	return (syncObj)
}

function refreshJob(jold, jnew) {
	for (var i in jnew)
		jold[i] = jnew[i]
}

function jobsPersist(syncObj, savedata, newdata, cb) {
	for (var i in savedata) {
		var found = 0
		for (var k in newdata) {
			if (savedata[i].Job_Id == newdata[k].Job_Id) {
				refreshJob(savedata[i], newdata[k])
				delete newdata[k]
				newdata[k] = savedata[i]
				syncObj = cb(savedata[i], syncObj)
				found = 1
				break
			}
		}
		if (!found)
			cb(savedata[i])
	}
	return (syncObj)
}

function clearJob(j, syncObj) {
	return (animWithObj(syncObj, j.gobj, {
		width: 0,
		height: 0,
	}, animTime))
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

	var syncObj = null
	// prune history
	syncObj = jobsPersist(syncObj, s_history, data.result.history, clearJob)
	// jobs -> history
	//syncObj = jobsPersist(syncObj, s_jobs, data.result.jobs)
	// queue -> jobs
	//syncObj = jobsPersist(syncObj, s_queue, data.result.queue)
	// newly queued
	//syncObj = jobsPersist(syncObj, data.result.queue, s_queue, boreJob)

	syncObj = drawJobs(syncObj, 'queue', gqueue, data.result.queue)
	syncObj = drawJobs(syncObj, 'jobs', gjobs, data.result.jobs)
	drawJobs(syncObj, 'history', ghistory, data.result.history)

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
	var pad = 30

	winw = window.innerWidth
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

	var x = pad
	gqueue = drawGrid('queue', x, sy, ow, oh, attr)
	x += ow + 2*pad
	gjobs = drawGrid('jobs', x, sy, ow, oh, attr)
	x += ow + 2*pad
	ghistory = drawGrid('history', x, sy, ow, oh, attr)

	scriptNode = document.createElement('script')
	document.body.appendChild(scriptNode)

	fetchData()
}
