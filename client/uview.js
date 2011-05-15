/* $Id$ */
/*
 * %PSC_START_COPYRIGHT%
 * -----------------------------------------------------------------------------
 * Copyright (c) 2010-2011, Pittsburgh Supercomputing Center (PSC).
 *
 * Permission to use, copy, and modify this software and its documentation
 * without fee for personal use or non-commercial use within your organization
 * is hereby granted, provided that the above copyright notice is preserved in
 * all copies and that the copyright and this permission notice appear in
 * supporting documentation.  Permission to redistribute this software to other
 * organizations or individuals is not permitted without the written permission
 * of the Pittsburgh Supercomputing Center.  PSC makes no representations about
 * the suitability of this software for any purpose.  It is provided "as is"
 * without express or implied warranty.
 * -----------------------------------------------------------------------------
 * %PSC_END_COPYRIGHT%
 */

/*
 * TODO
 * - job state transitions are broken
 * - legend
 */

var ghistory, gjobs, gqueue
var s_history, s_jobs, s_queue
var s_sysinfo

var winw, winh, canvas, scriptNode, data, old_data
var popJob
var deadJobs = null

var refetchTimeout = null, drawLabelsTimeout = null
var failedTimeout = null, popupTimeout = null

var gridStrokeWidth = 2
var animTime = 100
var inFetching = 0
var maxDescLen
var selectedSSI = 0
var maxTimeoutLength = 8

var dataURLs = [
	[ 'bl0', 'http://mugatu.psc.edu:24240/UView' ],
	[ 'bl1', 'http://mugatu.psc.edu:24241/UView' ]
]

var excludeList = [
	'ctime',
	'mtime',
	'etime',
	'qtime',

	'Color',
	'DispWidth',
	'Error_Path',
	'Hold_Types',
	'Job_Id',
	'Join_Path',
	'Keep_Files',
	'Mail_Points',
	'Mail_Users',
	'MemAlloc',
	'Output_Path',
	'Rerunable',
	'Resource_List:mem,walltime_max,walltime_min',
	'StrokeColor',
	'User_List',
	'WallTime',
	'gobj',
	'grid',
	'gtextobj',
	'gtextobj2',
	'interactive',
	'job_state',
	'server',
	'session_id',
	'start_count',
	'start_time',
	'submit_args',
	'umask',
]

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
	[ 255	, 191	, 0	]
]

var colIdx = 0

function computeShowExcl(name, attr) {
	for (var i in attr) {
		var r = attr[i].split(/:/)
		if (r[0] == name)
			return r[1].split(/,/)
	}
}

function fmtJobLabel(str) {
	return ('<span class="label">' + str.replace(/_/, ' ') + ':</span> ')
}

function strAttrs(o, addpre, excludeList, fmtlabel, pre, norecurse) {
	var t = ''
	for (var i in o) {
		if (excludeList && inArray(i, excludeList))
			continue

		if (pre)
			t += pre
		t += fmtlabel(i)
		if (norecurse == null && typeof(o[i]) == 'object')
			t += '\n' + strAttrs(o[i], addpre,
			    computeShowExcl(i, excludeList),
			    fmtlabel, (pre ? pre : '') + addpre)
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
	var s = strAttrs(o, '  ', null,
	    function(s) { return (s + ': ') },
	    '', 1)
	if (pre)
		s = pre + '\n' + s
	alert(s)
}

function getClip(obj, attr) {
	attr['clip-rect'] =
	    obj.attr('x') + ', ' +
	    obj.attr('y') + ', ' +
	    obj.attr('width') + ', ' +
	    (obj.attr('height') - gridStrokeWidth/2)
}

function getCol() {
	var c = colors[colIdx % colors.length]
	colIdx += 7
	return (c)
}

function getPopupPos(figx, figw, dispw, max, prefBefore) {
	var res, pad = 1
	if (prefBefore) {
		res = figx - dispw + pad
		if (res > 0)
			return (res)
		res = figx + figw - pad*2
		if (res + dispw < max)
			return (res)
		return (0)
	} else {
		res = figx + figw - pad*2
		if (res + dispw < max)
			return (res)
		res = figx - dispw + pad
		if (res > 0)
			return (res)
		return (max - dispw - 15)
	}
}

function inArray(str, list) {
	for (var j in list)
		if (list[j] == str)
			return (1)
	return (0)
}

function jobHover(j) {
	j.gobj.attr({
		'stroke-width': 4,
	})
	var o = document.getElementById('popup')
	o.innerHTML = '<h3>' +
	    '<div style="background-color: '+toHexColor(j.Color)+'; ' +
	    'border: 2px solid '+toHexColor(j.StrokeColor)+'"></div>' +
	    j.Job_Id + '</h3>' +
	    strAttrs(j, '&nbsp;&nbsp;', excludeList, fmtJobLabel).replace(/\n/g, '<br />')

	o.style.left = getPopupPos(j.gobj.attr('x'),
	    j.gobj.attr('width'), o.clientWidth, winw, 0) + 'px'
	var adjy = 0
	if (j.gobj.attr('height') < 10)
		adjy -= 10
	o.style.top = getPopupPos(j.gobj.attr('y') + adjy,
	    j.gobj.attr('height'), o.clientHeight, winh, 1) + 'px'

	if (popupTimeout && (popJob == j || popJob == null)) {
		window.clearTimeout(popupTimeout)
		popupTimeout = null
	} else {
		if (popJob) {
			window.clearTimeout(popupTimeout)
			popupTimeout = null
			clearPopup()
		}
		setVis('popup', 1)
		popJob = j
	}
}

function clearPopup() {
	popupTimeout = null
	    if (popJob)
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

function setPos(o, x, y) {
	o.style.left = Math.round(x) + 'px'
	o.style.top = Math.round(y) + 'px'
}

function setWidthLength(o, w, h) {
	o.style.width = Math.round(w) + 'px'
	o.style.height = Math.round(h) + 'px'
}

function animObj(obj, attr, time, cb) {
	obj.animate(attr, animTime, '>', cb)
}

function toHexColor(rgb) {
	var s = '#'
	for (var j = 0; j < 3; j++) {
		var n = rgb[j].toString(16)
		if (rgb[j] < 0x10)
			s += '0'
		s += n
	}
	return (s)
}

function strokeShade(orgb) {
	var n = []
	for (var j = 0; j < 3; j++)
		n[j] = Math.round(orgb[j] * .6)
	return (n)
}

function fmtSize(sz) {
	if (sz >= 1024)
		return (Math.round(sz/1024*100)/100 + 'T')
	return (sz + 'G')
}

function getJobLabelFontSize(label, w, h, min) {
	var n = Math.round(w/5)
	if (n < 14)
		n = 14
	var fadj = 2/3
	if (n > h * fadj)
		n = h * fadj
	if (w / label.length < n)
		n = w/label.length
	if (n < min)
		n = min
	return (Math.round(n))
}

function hasTransform(o) {
	return ('MozTransform' in o.style ||
	    'WebkitTransform' in o.style)
}

function setTransform(o, t) {
	if ('MozTransform' in o.style)
		o.style.MozTransform = t
	if ('WebkitTransform' in o.style)
		o.style.WebkitTransform = t
}

function drawSetLabels(jobs) {
	for (var i in jobs) {
		var j = jobs[i]

		if ('gtextobj' in j && j.gtextobj) {
			document.body.removeChild(j.gtextobj)
			document.body.removeChild(j.gtextobj2)
		}

		j.gtextobj = document.createElement('div')

		j.gtextobj.style.position = 'absolute'
		j.gtextobj.style.color = '#fff'
		j.gtextobj.style.cursor = 'default'
		j.gtextobj.style.fontWeight = 'bold'
		j.gtextobj.style.textAlign = 'center'
		j.gtextobj.style.lineHeight = '.8em'
		j.gtextobj.style.textShadow = '0 0 2px black, 0 0 1px black, 0 0 1px black'

		var label = fmtSize(j.MemAlloc)
		j.gtextobj.innerHTML = label
		j.gtextobj.style.fontSize = getJobLabelFontSize(label,
			j.gobj.attr('width'), j.gobj.attr('height'), 6) + 'pt'

		document.body.appendChild(j.gtextobj)

		setPos(j.gtextobj, j.gobj.attr('x') +
		    j.gobj.attr('width')/2 -
		    j.gtextobj.clientWidth/2,
		    j.gobj.attr('y') +
		    j.gobj.attr('height')/2-2 -
		    j.gtextobj.clientHeight/2)

		/* job name */
		j.gtextobj2 = document.createElement('div')
		j.gtextobj2.style.position = 'absolute'
		j.gtextobj2.style.color = '#fff'
		j.gtextobj2.style.cursor = 'default'
		j.gtextobj2.style.fontWeight = 'bold'
		j.gtextobj2.style.textAlign = 'center'
		j.gtextobj2.style.lineHeight = '.8em'
		j.gtextobj2.style.textShadow = '0 0 2px black, 0 0 1px black, 0 0 1px black'

		label = j.Job_Name
		if (label.length > 16)
			label = label.substring(0, 16).replace(/[.][a-zA-Z0-9]*$/, '')
		j.gtextobj2.innerHTML = label
		j.gtextobj2.style.fontSize = 10 + 'pt'

		var angle = 2 * Math.PI * 70 / 360

		document.body.appendChild(j.gtextobj2)

		var w = j.gtextobj2.clientWidth
		var labelX = j.gobj.attr('x') + j.gobj.attr('width')/2 - w/2
		if (hasTransform(j.gtextobj2)) {
			setPos(j.gtextobj2, labelX + w/2 - w * Math.cos(angle),
			    j.grid.attr('y') + j.grid.attr('height') +
			    w * Math.sin(angle)/2)

			setTransform(j.gtextobj2, 'rotate(70deg)')
		} else {
			setPos(j.gtextobj2, labelX, j.gobj.attr('y'))
		}

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

	clearStatus()
	inFetching = 0

	if (deadJobs) {
		for (var j in deadJobs)
			deadJobs[j].gobj.remove()

		delete deadJobs
		deadJobs = null
	}
}

function adjColor(rgb, incr) {
	var n = []
	for (var j = 0; j < 3; j++) {
		n[j] = rgb[j] + incr
		if (n[j] > 255)
			n[j] = 255
		else if (n[j] < 0)
			n[j] = 0
	}
	return (n)
}

function drawJobs(label, grid, jobs) {
	var jh, x, y

	var pad = 4

	var gridX = Math.round(grid.attr('x'))
	var gridY = Math.round(grid.attr('y'))
	var gridH = Math.round(grid.attr('height')) - gridStrokeWidth

	var availWidth = grid.attr('width') - gridStrokeWidth - 2*pad

	var minJobHeight = gridH/16/3
	var minJobWidth

	var minWallTime = 0
	var agwalltime = 0

	if (jobs.length > 0) {
		minJobWidth = Math.min(availWidth / jobs.length - 2*pad, 35)
		minWallTime = jobs[0].WallTime
	}
	for (var i in jobs) {
		if (jobs[i].WallTime < minWallTime)
			minWallTime = jobs[i].WallTime
		agwalltime += jobs[i].WallTime
	}
	if (agwalltime == 0)
		agwalltime = 1

	if (availWidth * minWallTime / agwalltime - 2*pad < minJobWidth) {
		for (var jj = 0; jj < 2; jj++) {
			var fabWallTime = agwalltime * minJobWidth / availWidth
			agwalltime = 0
			for (var i in jobs) {
				if (jobs[i].WallTime < fabWallTime)
					jobs[i].WallTime = fabWallTime
				agwalltime += jobs[i].WallTime
			}
		}
	}

	for (var i in jobs)
		jobs[i].DispWidth = availWidth *
		    jobs[i].WallTime / agwalltime - 2*pad

	x = gridX + Math.round(gridStrokeWidth/2) + pad
	y = gridY + gridH + 2*gridStrokeWidth
	for (var i in jobs) {
		var j = jobs[i]
		j.grid = grid

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
				fill: '105' +
				    '-' + toHexColor(adjColor(j.Color, 26)) +
				    '-' + toHexColor(j.Color) + ':20' +
				    '-' + toHexColor(adjColor(j.Color, -102)),
				stroke: toHexColor(j.StrokeColor),
				'stroke-width': 3,
			}
			getClip(grid, jattr)
			j.gobj = canvas.rect(x, y, 0, 0, pad);
			(function(j) {
				j.gobj.attr(jattr).hover(
				    function() { jobHover(j) },
				    function() { jobUnhover(j) }
				)
			})(j)
		}

		if (j.gtextobj) {
			document.body.removeChild(j.gtextobj)
			document.body.removeChild(j.gtextobj2)
			j.gtextobj = null
		}

		if (j.gobj.attr('x') == x && j.gobj.attr('y') == y-jh &&
		    j.gobj.attr('width') == j.DispWidth &&
		    j.gobj.attr('height') == jh) {
			if (drawLabelsTimeout)
				window.clearTimeout(drawLabelsTimeout)
			drawLabelsTimeout =
			    window.setTimeout('drawLabels()', 100)
		} else {
			if (drawLabelsTimeout) {
				window.clearTimeout(drawLabelsTimeout)
				drawLabelsTimeout = null
			}
			animObj(j.gobj, {
				x: x,
				y: y - jh,
				width: j.DispWidth,
				height: jh,
			}, animTime, function() {
				if (drawLabelsTimeout)
					window.clearTimeout(drawLabelsTimeout)
				drawLabelsTimeout =
				    window.setTimeout('drawLabels()', 100)
			})
		}

		x += j.DispWidth + pad
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
		if (!found) {
			if (notfoundcb)
				notfoundcb(savedata[i])
			nf.push(savedata[i])
		}
	}
	return (nf)
}

function clearJob(j) {
	document.body.removeChild(j.gtextobj)
	document.body.removeChild(j.gtextobj2)
	return (animObj(j.gobj, {
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
	return (nnodes * s_sysinfo['gb_per_memnode'])
}

function massageJobs(jobs) {
	for (var i in jobs) {
		var j = jobs[i]
		if ('Resource_List' in j) {
			if ('nodeset' in j.Resource_List)
				j.MemAlloc = calcMemAlloc(j.Resource_List.nodeset)
			else if ('ncpus' in j.Resource_List)
				j.MemAlloc = s_sysinfo['mempercpu'] * j.Resource_List.ncpus
			var cpn = j['Resource_List']['walltime'].split(/:/)
			j.WallTime = parseInt(cpn[0], 10) + parseInt(cpn[1], 10)/60
			if (j.WallTime == 0)
				j.WallTime = 1
		} else
			j.WallTime = 1

		if ('start_time' in j)
			j['Start time'] = new Date(j.start_time * 1000).toString()
		else if ('etime' in j)
			j['Eligible time'] = new Date(j.etime * 1000).toString()
		if ('Job_Owner' in j)
			j['Job_Owner'] = j['Job_Owner'].replace(/@.*/, '')
	}
}

function drawGridLines(gobj) {
	if (gobj.gridLines) {
		for (var i in gobj.gridLines)
			gobj.gridLines[i].remove()
	}
	gobj.gridLines = []

	var x = gobj.attr('x')+gridStrokeWidth/2
	var y = gobj.attr('y')
	var h = gobj.attr('height')
	var w = gobj.attr('width')-gridStrokeWidth
	var ty = y+h+h/16
	var o
	for (var j = 0; j < 16; j++) {
		ty -= h/16
		o = canvas.path('M '+x+' '+ty+' L '+(x+w)+' '+ty).attr({stroke: '#333'})
		gobj.gridLines.push(o)
		o = canvas.text(x+15, ty-5, fmtSize(j*s_sysinfo['mem']/16)).attr({
		    fill: '#999',
		    'font-family': 'Candara'
		})
		gobj.gridLines.push(o)
	}
}

function loadData() {
	if (failedTimeout) {
		window.clearTimeout(failedTimeout)
		failedTimeout = null
	}

	if (data == null) {
		data = {
			result: {
				history: [],
				jobs: [],
				queue: [],
				sysinfo: [],
			}
		}
		setStatus('Load failed')
		inFetching = 0
	} else {
		setStatus('Data load successful, drawing...')

		if (data.result.sysinfo && (s_sysinfo == null ||
		    s_sysinfo['hostname'] != data.result.sysinfo['hostname'])) {
			s_sysinfo = data.result.sysinfo

			drawGridLines(ghistory)
			drawGridLines(gjobs)
			drawGridLines(gqueue)

			document.getElementById('host').innerHTML = s_sysinfo['hostname']
		}

		massageJobs(data.result.history)
		massageJobs(data.result.jobs)
		massageJobs(data.result.queue)

		// prune history
		var tj = jobsPersist(s_history, data.result.history, clearJob)
		deadJobs = tj

		tj = jobsPersist(s_jobs, data.result.history)
		tj = jobsPersist(tj, data.result.jobs, clearJob)
		deadJobs.concat(tj)

		tj = jobsPersist(s_queue, data.result.history)
		tj = jobsPersist(tj, data.result.jobs)
		tj = jobsPersist(tj, data.result.queue, clearJob)
		deadJobs.concat(tj)

		s_history = data.result.history
		s_jobs = data.result.jobs
		s_queue = data.result.queue

		drawJobs('queue', gqueue, data.result.queue)
		drawJobs('jobs', gjobs, data.result.jobs)
		drawJobs('history', ghistory, data.result.history)
	}

	if (refetchTimeout)
		window.clearTimeout(refetchTimeout)
	refetchTimeout = window.setTimeout('fetchData()', 60 * 1000)
}

function elapsedLoadIntv(to) {
	if (!inFetching)
		return

	if (to) {
		setStatus('Loading data from ' + dataURLs[selectedSSI][0] +
		    ', timeout ' + to + ' sec...')

		to--;
		failedTimeout = window.setTimeout('elapsedLoadIntv(' + to + ')', 1 * 1000)
	} else {
		if (failedTimeout)
			window.clearTimeout(failedTimeout)
		failedTimeout = null

		var newSNode = document.createElement('script')
		document.body.replaceChild(newSNode, scriptNode)
		scriptNode = newSNode

		inFetching = 0

		if (refetchTimeout)
			window.clearTimeout(refetchTimeout)
		refetchTimeout = window.setTimeout('fetchData()', 5 * 1000)

		setStatus('Data failed to load, will retry in 1 minute')
	}
}

function fetchData() {
	if (inFetching)
		return

	if (refetchTimeout) {
		window.clearTimeout(refetchTimeout)
		refetchTimeout = null
	}

	inFetching = 1

	old_data = data
	data = null

	var newSNode = document.createElement('script')
	newSNode.type = 'text/javascript'
	newSNode.src = dataURLs[selectedSSI][1] + '?' + Math.random()
	newSNode.onload = loadData
	document.body.replaceChild(newSNode, scriptNode)
	scriptNode = newSNode

	elapsedLoadIntv(maxTimeoutLength)
}

function drawGrid(name, x, y, w, h) {
	var attr = {
		'stroke-width': gridStrokeWidth,
		stroke: '#666',
		fill: '300-#666-#222:5-#000'
	}

	var obj = canvas.rect(x, y, w, h).attr(attr)

	var o = document.getElementById(name)
	o.style.left = Math.round(x+w/2 - o.clientWidth/2) + 'px'
	o.style.top = Math.round(y - o.clientHeight) + 'px'

	var o = document.getElementById('no' + name)
	o.style.left = Math.round(x+w/2 - o.clientWidth/2) + 'px'
	o.style.top = Math.round(y+5*h/6 - o.clientHeight/2) + 'px'

	return (obj)
}

function setStatus(msg) {
	var o = document.getElementById('statusline')
	o.innerHTML = msg

	o = document.getElementById('status')
	o.style.top = winh - o.clientHeight - 3 + 'px'
	o.style.left = winw/2 - o.clientWidth/2 + 'px'
}

function clearStatus(msg) {
	setStatus('')
}

function chooseSSI(i) {
	if (selectedSSI == i)
		return
	elapsedLoadIntv(0)
	selectedSSI = i
	fetchData()
}

window.onload = function() {
	var pad = 30

	winw = window.innerWidth
	winh = window.innerHeight
	canvas = Raphael(0, 0, winw, winh)

	var sy = 2*winh/5
	var oh = 2*winh/5
	var ow = (winw - pad)/3 - pad

	var x = pad
	gqueue = drawGrid('queue', x, sy, ow, oh)
	x += ow + pad
	gjobs = drawGrid('jobs', x, sy, ow, oh)
	x += ow + pad
	ghistory = drawGrid('history', x, sy, ow, oh)

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
		var ch = String.fromCharCode(e.which)
		switch (ch) {
		case ' ':
			fetchData()
			break
		case '0':
			chooseSSI(0)
			break
		case '1':
			chooseSSI(1)
			break
		case 'h':
			var o = document.getElementById('help')
			if (o.style.visibility == 'visible') {
				setVis('help', 0)
				setVis('helpback', 0)
				break
			}

			setVis('helpback', 1)

			setPos(o, winw/5, winh/5)
			setWidthLength(o, 3*winw/5, 3*winh/5)
			setVis('help', 1)

			o = document.getElementById('currentssi')
			var s = '<form action="#">' +
			    'SSI to load data from: ' +
				'<select onchange="chooseSSI(this.selectedIndex)">'

			for (var j = 0; j < dataURLs.length; j++)
				s += '<option' +
				     (selectedSSI == j ? ' selected="selected"' : '') + '>' +
					dataURLs[j][0] + '</option>'

			s +=	'</select>' +
			    '</form>'

			o.innerHTML = s
			break
		}
	}

	fetchData()
}
