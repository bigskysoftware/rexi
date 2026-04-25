<h1>&#x1F415; rexi.js - <i>a fluent little fetch...</i></h1>

rexi.js is an experimental, minimalist fetch wrapper with HTTP-verb shortcuts, form
serialization, chainable body parsers, and throw-on-error semantics. It's the JSON-side
companion for the [fixi.js](https://github.com/bigskysoftware/fixi) family: for the times
you do need to talk to an API from client code.

Part of the [fixi project](https://fixiproject.org).

Here is an example:

```html
<script src="rexi.js"></script>
<script>
    let me = await get("/api/me").json()
    await post("/api/login", document.forms.login)          // form element
    await post("/api/users", {name: "Ada"})                 // JSON body
    await get("/search", {q: "hi"}, {include: "#filters"})  // query string + extra fields
</script>
```

Six verb helpers (`get`, `head`, `post`, `put`, `patch`, `del`) are attached to
`globalThis` for zero-ceremony use. Each returns a decorated `Promise<Response>` with
`.json()`, `.text()`, `.blob()`, `.html()`, `.raw()`, and `.abort()` sugar so the common
case is one `await`.

## Minimalism

rexi is deliberately tiny: no interceptor pipeline, no retry logic, no automatic base
URL, no upload progress, no caching layer, no built-in download helper. If your app
outgrows it, reach for [ky](https://github.com/sindresorhus/ky) or
[wretch](https://github.com/elbywan/wretch).

## Installing

Drop `rexi.js` into a script tag:

```html
<script src="rexi.js"></script>
```

Or install via npm:

```
npm install rexi-js
```

## API

### Verbs

All six verbs share the same shape:

```
get|head|post|put|patch|del(url, body?, opts?)
```

`del` is used instead of `delete` because bare `delete(x)` is a JavaScript syntax trap.
Both `rexi.del` and `window.del` are exposed.

### Body normalization

The second positional arg is a logical "input". Its type decides the wire format:

| Input                                     | Sent as                                            |
|-------------------------------------------|----------------------------------------------------|
| `FormData`                                | as-is                                              |
| `HTMLFormElement`                         | `new FormData(el)`                                 |
| single named input element                | `FormData` with one `[name, value]` entry          |
| iterable of elements (e.g. moxi `q(...)`) | `FormData` collecting each element's `[name,value]`|
| plain object                              | `JSON.stringify`, `Content-Type: application/json` |
| `string` / `Blob` / `URLSearchParams` / `ArrayBuffer` | passed straight to fetch               |
| `null` / `undefined`                      | no body                                            |

### Method disposition

By default `GET` / `HEAD` / `DEL` URL-encode the body into the query string (with
repeating keys for array values), and `POST` / `PUT` / `PATCH` send it in the request
body. Override with `opts.send: "query" | "body"`.

### Options

```js
{
  include: selector | Element | iterable | Array<any of those>,  // merge extra form fields
  send:    "query" | "body",                                     // override method default
  timeout: ms,                                                   // abort after N ms
  signal:  AbortSignal,                                          // external cancel, chains in
  headers: {...},                                                // merged with auto Content-Type
  ...                                                            // passed through to fetch()
}
```

`include` with a JSON body promotes the request to form mode (the JSON object is
flattened into FormData entries).

### Response helpers

```js
let p = get(url, body, opts)
await p.json()   // parsed JSON
await p.text()   // string
await p.blob()   // Blob
await p.html()   // DocumentFragment (parsed via <template>)
await p.raw()    // the raw Response
p.abort()        // cancel the underlying fetch
```

Non-2xx responses throw an `Error` carrying `.status` and `.response` (the raw
Response, for bodies/headers).

### Lifecycle events

rexi dispatches two CustomEvents on `document`:

* `rexi:before` - cancelable; `detail.cfg = {url, init}` can be mutated (e.g. to inject
  an `Authorization` header). `preventDefault()` aborts the request with `AbortError`.
* `rexi:after` - fires for every completed fetch (including non-2xx, before rexi
  throws); `detail = {cfg, response}`.

```js
document.addEventListener("rexi:before", (e) => {
    e.detail.cfg.init.headers.Authorization = `Bearer ${token}`
})
```

## LICENCE

BSD-0
