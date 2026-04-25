(()=>{
	let QS_DEFAULT = {GET: 1, HEAD: 1, DELETE: 1}
	let doc = document

	let isEltIter = (x)=>{
		if (!x || typeof x !== "object" || x instanceof FormData || x instanceof Element) return false
		if (!(Symbol.iterator in x)) return false
		for (let i of x) return i instanceof Element
		return false
	}

	let isRaw = (b)=>typeof b === "string"
		|| b instanceof Blob
		|| b instanceof URLSearchParams
		|| b instanceof ArrayBuffer

	let appendFields = (fd, el)=>{
		if (!el) return
		if (el instanceof HTMLFormElement) { for (let [k, v] of new FormData(el)) fd.append(k, v); return }
		if (!el.name) return
		if (el instanceof HTMLInputElement) {
			if (el.type === "file") { for (let f of el.files) fd.append(el.name, f) }
			else if (el.type === "checkbox" || el.type === "radio") { if (el.checked) fd.append(el.name, el.value) }
			else fd.append(el.name, el.value)
		} else if (el instanceof HTMLSelectElement && el.multiple) {
			for (let o of el.selectedOptions) fd.append(el.name, o.value)
		} else if ("value" in el) fd.append(el.name, el.value)
	}

	let toFD = (body)=>{
		if (body instanceof FormData) return body
		let fd = new FormData()
		if (body == null) return fd
		if (body instanceof URLSearchParams) { for (let [k, v] of body) fd.append(k, v); return fd }
		if (typeof body === "string") { for (let [k, v] of new URLSearchParams(body)) fd.append(k, v); return fd }
		if (body instanceof Element) appendFields(fd, body)
		else if (isEltIter(body)) { for (let el of body) appendFields(fd, el) }
		else for (let [k, v] of Object.entries(body)) {
			if (Array.isArray(v)) { for (let x of v) fd.append(k, x) }
			else if (v != null) fd.append(k, v)
		}
		return fd
	}

	let resolve = (inc)=>{
		if (inc == null) return []
		if (typeof inc === "string") return [...doc.querySelectorAll(inc)]
		if (inc instanceof Element) return [inc]
		if (Symbol.iterator in Object(inc)) {
			let out = []
			for (let i of inc) for (let e of resolve(i)) out.push(e)
			return out
		}
		return []
	}

	let isJson = (b)=>b != null && typeof b === "object" && !(b instanceof FormData) && !(b instanceof Element) && !isEltIter(b) && !isRaw(b)

	let toQS = (fd)=>{
		let p = new URLSearchParams()
		for (let [k, v] of fd) if (!(v instanceof Blob)) p.append(k, v)
		return p.toString()
	}

	let wrap = (p, ctl)=>{
		p.json  = ()=>p.then((r)=>r.json())
		p.text  = ()=>p.then((r)=>r.text())
		p.blob  = ()=>p.then((r)=>r.blob())
		p.html  = ()=>p.then((r)=>r.text()).then((t)=>{let tpl = doc.createElement("template"); tpl.innerHTML = t; return tpl.content})
		p.raw   = ()=>p
		p.abort = ()=>ctl.abort()
		return p
	}

	let req = async (method, url, body, ctl, {timeout, signal, include, send, headers = {}, ...rest} = {})=>{
		if (signal) signal.addEventListener("abort", ()=>ctl.abort(), {once: true})
		if (timeout) setTimeout(()=>ctl.abort(), timeout)
		let asQuery = (send === "query") || (send !== "body" && QS_DEFAULT[method])
		let init = {method, headers: {...headers}, ...rest, signal: ctl.signal}
		if (asQuery) {
			let fd = toFD(body)
			for (let el of resolve(include)) appendFields(fd, el)
			let qs = toQS(fd)
			if (qs) url += (url.includes("?") ? "&" : "?") + qs
		} else if (isRaw(body)) {
			init.body = body
		} else if (include == null && isJson(body)) {
			init.body = JSON.stringify(body)
			init.headers["Content-Type"] ??= "application/json"
		} else if (body != null || include != null) {
			let fd = toFD(body)
			for (let el of resolve(include)) appendFields(fd, el)
			init.body = fd
		}
		let cfg = {url, init}
		if (!doc.dispatchEvent(new CustomEvent("rexi:before", {detail: {cfg}, cancelable: true}))) {
			throw new DOMException("Request cancelled by rexi:before listener", "AbortError")
		}
		let res = await fetch(cfg.url, cfg.init)
		doc.dispatchEvent(new CustomEvent("rexi:after", {detail: {cfg, response: res}}))
		if (!res.ok) throw Object.assign(new Error(`${method} ${cfg.url} -> ${res.status}`), {status: res.status, response: res})
		return res
	}

	let make = (method)=>(url, body, opts)=>{
		let ctl = new AbortController()
		return wrap(req(method, url, body, ctl, opts), ctl)
	}

	let api = {}
	for (let n of ["get", "head", "post", "put", "patch"]) api[n] = make(n.toUpperCase())
	api.del = make("DELETE")
	window.rexi = api
	for (let k of ["get", "head", "post", "put", "patch", "del"]) window[k] = api[k]
})()
