/* $Id$ */

var winw, winh, canvas, scriptNode, data
var ghistory, gjobs, gqueue
var s_history, s_jobs, s_queue
var s_sysinfo
var popJob
var refetchTimeout = null
var drawLabelsTimeout = null

var excludeList = [
	'ctime',
	'mtime',
	'etime',
	'qtime',

	'Color',
	'Error_Path',
	'Hold_Types',
	'Job_Id',
	'Join_Path',
	'Keep_Files',
	'Mail_Points',
	'MemAlloc',
	'Output_Path',
	'Rerunable',
	'Resource_List:mem',
	'StrokeColor',
	'User_List',
	'exec_host',
	'gobj',
	'gtextobj',
	'job_state',
	'server',
	'session_id',
	'start_count',
	'start_time',
	'submit_args',
	'umask',
]

var gridStrokeWidth = 2
var popupTimeout
var animTime = 700

function computeShowExcl(name, attr) {
	for (var i in attr) {
		var r = attr[i].split(/:/)
		if (r[0] == name)
			return r[1].split(/,/)
	}
}

function strAttrs(o, addpre, excludeList, pre, norecurse) {
	var t = ''
	for (var i in o) {
		if (excludeList && inArray(i, excludeList))
			continue

		if (pre)
			t += pre
		t += i.replace(/_/, ' ') + ': '
		if (norecurse == null && typeof(o[i]) == 'object')
			t += '\n' + strAttrs(o[i], addpre,
			    computeShowExcl(i, excludeList),
			    (pre ? pre : '') + addpre)
		else {
			try {
				t += o[i]
			} catch (e) {
				t += '?'
			}
			t += '\n'
		}
	}
	return (t)
}

function displayAttrs(o, pre) {
	var s = strAttrs(o, '', '  ', null, 1)
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
	var res = figx + figw - pad*2
	if (res + dispw < max)
		return (res)
	res = figx - dispw + pad
	if (res > 0)
		return (res)
	if (prefBefore)
		return (0)
	return (max - dispw - 15)
}

function inArray(str, list) {
	for (var j in list)
		if (list[j] == str)
			return (1)
	return (0)
}

function jobHover(j) {
	j.gobj.attr({
		'stroke-width': 6,
	})
	var o = document.getElementById('popup')
	o.innerHTML = '<h3>' +
	    '<div style="background-color: '+toHexColor(j.Color)+'; ' +
	    'border: 2px solid '+toHexColor(j.StrokeColor)+'"></div>' +
	    j.Job_Id + '</h3>' + strAttrs(j, '&nbsp;&nbsp;', excludeList).replace(/\n/g, '<br />')

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

function jobUnhover(j) {
	popupTimeout = window.setTimeout('clearPopup()', 100)
}

function setVis(name, vis) {
	var o = document.getElementById(name)
	if (vis)
		o.style.visibility = 'visible'
	else
		o.style.visibility = 'hidden'
}

function animWithObj(obj, attr, time, cb) {
	attr.easing = '>'
	obj.animate(attr, animTime, cb)
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

function fmtSize(sz) {
	if (sz >= 1024)
		return (Math.round(sz/1024*100)/100 + 'TB')
	return (sz + 'GB')
}

function getJobLabelFontSize(label, w, h) {
	var n = Math.round(w/5)
	if (n < 14)
		n = 14
	var fadj = 5
	if (n > h - fadj)
		n = h - fadj
	if (w / label.length < n)
		n = w/label.length
	return (n)
}

function drawSetLabels(jobs) {
	for (var i in jobs) {
		var j = jobs[i]

		j.gtextobj = document.createElement('div')
		j.gtextobj.style.position = 'absolute'
		j.gtextobj.style.color = '#fff'
		j.gtextobj.style.fontWeight = 'bold'
		j.gtextobj.style.textShadow = '0 0 2px black, 0 0 1px black, 0 0 1px black'

		var label = fmtSize(j.MemAlloc)
		j.gtextobj.innerHTML = label
		j.gtextobj.style.fontSize = getJobLabelFontSize(label,
			j.gobj.attr('width'), j.gobj.attr('height')) + 'pt'

		document.body.appendChild(j.gtextobj)

		j.gtextobj.style.left =
		Math.round(j.gobj.attr('x') +
			j.gobj.attr('width')/2 -
			j.gtextobj.clientWidth/2) + 'px'
		j.gtextobj.style.top =
		Math.round(j.gobj.attr('y') +
			j.gobj.attr('height')/2-2 -
			j.gtextobj.clientHeight/2) + 'px'

		;(function(j) {
			j.gtextobj.onmouseover = function() { jobHover(j) }
			j.gtextobj.onmouseout = function() { jobUnhover(j) }
		})(j)
	}
}

function drawLabels() {
	drawLabelsTimeout = null
	drawSetLabels(data.result.history)
	drawSetLabels(data.result.jobs)
	drawSetLabels(data.result.queue)
}

function drawJobs(label, grid, jobs) {
	var jw, jh, x, y

	var pad = 4

	var gridX = Math.round(grid.attr('x'))
	var gridY = Math.round(grid.attr('y'))
	var gridH = Math.round(grid.attr('height')) - gridStrokeWidth

	var minJobHeight = 2*gridH / (s_sysinfo['mem']/1024) / 3

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
		if (jh < minJobHeight)
			jh = minJobHeight

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
			j.gobj = canvas.rect(gridX, gridY+gridH+8, 0, 0, pad);
			(function(j) {
				j.gobj.attr(jattr).hover(
				    function() { jobHover(j) },
				    function() { jobUnhover(j) }
				)
			})(j)
		}

		if (j.gtextobj)
			document.body.removeChild(j.gtextobj)

		animWithObj(j.gobj, {
			x: x,
			y: y - jh,
			width: Math.round(jw),
			height: jh,
		}, animTime, function() {
			if (drawLabelsTimeout)
				window.clearTimeout(drawLabelsTimeout)
			drawLabelsTimeout =
			    window.setTimeout('drawLabels()', 100)
		})

		x += jw + pad
	}
	setVis('no' + label, jobs.length == 0)
}

function refreshJob(jold, jnew) {
	for (var i in jnew)
		jold[i] = jnew[i]
}

function jobsPersist(savedata, newdata, notfoundcb) {
	var nf = []
	for (var i in savedata) {
		var found = 0
		for (var k in newdata) {
			if (savedata[i].Job_Id == newdata[k].Job_Id) {
				refreshJob(savedata[i], newdata[k])
				delete newdata[k]
				newdata[k] = savedata[i]
				found = 1
				break
			}
		}
		if (!found && notfoundcb) {
			notfoundcb(savedata[i])
			nf[nf.length] = savedata[i]
		}
	}
	return (nf)
}

function clearJob(j) {
	return (animWithObj(j.gobj, {
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

function massageJobs(jobs) {
	for (var i in jobs) {
		var j = jobs[i]
		if ('Resource_List' in j) {
			if ('nodeset' in j.Resource_List)
				j.MemAlloc = calcMemAlloc(j.Resource_List.nodeset)
			else if ('ncpus' in j.Resource_List)
				j.MemAlloc = s_sysinfo['mempercpu'] * j.Resource_List.ncpus
		}
		if ('start_time' in j)
			j['Start time'] = new Date(j.start_time * 1000).toString()
		else if ('etime' in j)
			j['Eligible time'] = new Date(j.etime * 1000).toString()
		if ('Job_Owner' in j)
			j['Job_Owner'] = j['Job_Owner'].replace(/@.*/, '')
	}
}

function redraw() {
	drawJobs('queue', gqueue, data.result.queue)
	drawJobs('jobs', gjobs, data.result.jobs)
	drawJobs('history', ghistory, data.result.history)
}

function loadData() {
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

	massageJobs(data.result.history)
	massageJobs(data.result.jobs)
	massageJobs(data.result.queue)

	// prune history
	jobsPersist(s_history, data.result.history, clearJob)

	var tj = jobsPersist(s_jobs, data.result.history)
	jobsPersist(tj, data.result.jobs, clearJob)

	tj = jobsPersist(s_queue, data.result.history)
	jobsPersist(tj, data.result.jobs)
	jobsPersist(tj, data.result.queue, clearJob)

	s_history = data.result.history
	s_jobs = data.result.jobs
	s_queue = data.result.queue

	redraw()

	if (refetchTimeout)
		window.clearTimeout(refetchTimeout)
	refetchTimeout = window.setTimeout('fetchData()', 60 * 1000)
}

function fetchData() {
	if (refetchTimeout) {
		window.clearTimeout(refetchTimeout)
		refetchTimeout = null
	}

	var newSNode = document.createElement('script')
	newSNode.type = 'text/javascript'
	newSNode.src = 'http://localhost:24240/UView'
	newSNode.onload = loadData
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

	var sy = winh/5
	var oh = 4*winh/5-sy*2
	var ow = (winw - pad)/3 - pad
	var attr = {
		"stroke-width": gridStrokeWidth,
		"stroke": '#666'
	}

	var x = pad
	gqueue = drawGrid('queue', x, sy, ow, oh, attr)
	x += ow + pad
	gjobs = drawGrid('jobs', x, sy, ow, oh, attr)
	x += ow + pad
	ghistory = drawGrid('history', x, sy, ow, oh, attr)

	var o = document.getElementById('legend')
	o.style.top = sy + oh + pad + 'px'
	o.style.left = winw/2 - o.clientWidth/2 + 'px'

	scriptNode = document.createElement('script')
	document.body.appendChild(scriptNode)

	data = {
		result: {
			history: [],
			jobs: [],
			queue: [],
			sysinfo: [],
		}
	}

	document.onkeypress = function (e) {
		switch (String.fromCharCode(e.which)) {
		case ' ':
			fetchData()
			break
		}
	}

	fetchData()
}
