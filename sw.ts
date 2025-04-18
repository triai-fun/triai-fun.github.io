/// <reference lib="webworker" />
/// <reference path="../src/core/global.d.ts" />
/// <reference path="../src/core/IProcessor.d.ts" />
/// <reference path="../src/core/IGlobalMessage.d.ts" />
/// <reference path="../src/core/http/IHttpResponse.d.ts" />

// declare const self: ServiceWorkerGlobalScope

const PREV_FIX_API = "/pump/api/"

const _self = self as unknown as ServiceWorkerGlobalScope
let fetchPromiseMapSize = 0
const fetchPromiseMap = new Map<Pick<Request, "url" | "method" | "body">, {
    request: Request
    promise: Promise<Response>
}>()
type UserInfoResponse = HttpResponse<{ walletAddress: string, token: string }>

_self.addEventListener("fetch", async function (event) {
    const url = new URL(event.request.url)
    for (const intor of ignoreFetchInterceptors) {
        let result = intor.checker(event.request)
        if (result instanceof Promise) {
            result = await result
        }
        if (result) {
            return
        }
    }
    event.request.signal.addEventListener("abort", eve => {
        console.log("event stop by abort", event.request.url)
    })
    let request = event.request
    let hasChange = false
    for (const interceptor of interceptors) {
        if (!interceptor.checker(request))
            continue
        hasChange = true
        const result = interceptor.preHandle(event.request)
        const res = await (result instanceof Promise ? result : Promise.resolve(result))
        if (res instanceof Request) {
            request = res
            break
        }
        if (res instanceof Response) {
            return event.respondWith(res)
        }
        if (!res) {
            console.log(`It's intercept by sw:${request.url}`)
            const response = new Response(`Intercepted by ${interceptor.constructor.name}`)
            try {
                event.respondWith(response)
            } catch (e) {
                console.error("intercept error", event.request.url, e)
            }
        }
    }
    if (!hasChange) {
        return
    }
    const _request = request.clone()
    const promise = fetch(request, { signal: request.signal }).then(async response => {
        let _response = response.clone()
        for (const interceptor of interceptors) {
            if (typeof interceptor.postHandle !== "function" || !interceptor.checker(_request))
                continue
            _response = await interceptor.postHandle(_request, _response)
        }
        return _response
    })

    /*const key = {
        url: request.url,
        method: request.method,
        body: request.body,
    }
    if (repeatFetchInterceptor.checker(request) && fetchPromiseMapSize < 100 && !fetchPromiseMap.has(key)) {
        fetchPromiseMap.set(key, {
            request,
            promise: promise.finally(() => {
                fetchPromiseMap.delete(key)
                fetchPromiseMapSize--
            }),
        })
        fetchPromiseMapSize++
    }*/
    try {
        event.respondWith(promise)
    } catch (e) {
        console.error("event respond error", event.request.url, e)
    }
})

_self.addEventListener('install', event => {
    _self.skipWaiting()
})

_self.addEventListener('activate', event => {
    event.waitUntil(
        _self.clients.claim()
    )
})

_self.addEventListener("message", event => {
    receiveMessageFromClient(event.data, event)
})

function sendMessageToClient(mqMsg: MessageQueueMsg) {
    return _self.clients.matchAll()
        .then(clients => {
            switch (mqMsg.consumeType) {
                case "all":
                    clients.forEach(client => {
                        client.postMessage(mqMsg.message)
                    })
                    break
                case "one":
                    const _clients = _ArrayUtils.toShuffled(clients)
                    _clients.find(client => client)?.postMessage(mqMsg.message)
                    break
            }
        })
}

function receiveMessageFromClient(data: IGlobalMessage, event: ExtendableMessageEvent) {
    switch (data.event) {
        case "request-logout":
            httpRequestAuthorizationInterceptor.clearUserToken()
            void sendMessageToClient({
                consumeType: "all",
                message: {
                    event: "login_status_change",
                    data: "confirm-logout",
                },
            })
            break
        case "update_uesr_token":
            httpRequestAuthorizationInterceptor.userToken = data.data as string
            break
    }
}

class NextJSInterceptor implements SimpleInterceptor {
    checker(request: Request) {
        const url = new URL(request.url)
        return (
            url.pathname.includes(".")
            || url.pathname.endsWith("css")
            || url.pathname.endsWith("css2")
            || url.pathname.includes("_nextjs_")
            || url.pathname.split("/").length <= 1
        )
            && request.method === "GET"
    }
}

class PageInterceptor implements SimpleInterceptor {
    checker(request: Request) {
        const url = new URL(request.url)
        return !url.pathname.startsWith(PREV_FIX_API) && request.method === "GET"
    }
}

const ignoreFetchInterceptors: SimpleInterceptor[] = [
    new NextJSInterceptor(),
    new PageInterceptor(),
]

class RepeatFetchInterceptor implements Interceptor {

    constructor() {
    }

    checker(request: Request) {
        const key = {
            url: request.url,
            method: request.method,
            body: request.body,
        }
        return fetchPromiseMap.has(key) && isRequestsEqual(request, fetchPromiseMap.get(request)?.request as Request)
    }

    preHandle(request: Request) {
        console.log(`Match request cache by sw:${request.url}`)
        return fetchPromiseMap.get(request)?.promise as Promise<Response>
    }

}

class HttpRequestAuthorizationInterceptor implements Interceptor {

    private KEY = "Authorization"

    private _userToken: string | null = null

    get userToken() {
        return this._userToken ?? ""
    }

    set userToken(token: string) {
        console.log("set userToken")
        this._userToken = token
    }

    clearUserToken() {
        this._userToken = null
    }

    clearUserTokenAndTokenStore() {
        this._userToken = null
        void sendMessageToClient({
            consumeType: "all",
            message: {
                event: "login_status_change",
                data: "request-logout",
            },
        })
    }

    checker(request: Request) {
        const url = new URL(request.url)
        return url.pathname.startsWith(`${PREV_FIX_API}`) && (this.checkIsUserApi(url) || this.checkIsUserDao(url))
    }

    checkIsUserApi(url: URL) {
        return url.pathname.endsWith("/login") || url.pathname.includes("/my-asset/") || url.pathname.endsWith("/user")
    }

    private checkIsUserDao(url: URL) {
        return url.pathname.endsWith("/vote/daos") ||  url.pathname.endsWith("/vote/dao/detail") || url.pathname.endsWith("/vote/dao/apply") || url.pathname.includes("/vote/my/") || url.pathname.includes("/vote/last/claim")
    }

    async preHandle(request: Request) {
        console.info("request.url", request.url)
        if (request.url.endsWith("/login")) {
            this.clearUserToken()
            return true
        }
        // if (request.url.endsWith("/user")) {
        //     const requesetToken = request.headers.get(this.KEY)
        //     const hasRequesetToken = !!requesetToken
        //     if (hasRequesetToken && this.tokenMapper.has(requesetToken as string)) {
        //         return new Response(JSON.stringify(this.tokenMapper.get(requesetToken as string)))
        //     }
        //     return new Response("No match token")
        // }
        if (!this.userToken) {
            if (request.url.endsWith("/user") && request.headers.has(this.KEY)) {
                this.userToken = request.headers.get(this.KEY) as string
                return true
            }
            return true
        }
        if (!request.headers.has(this.KEY)) {
            const headers = new Headers(request.headers)
            headers.set(this.KEY, this.userToken)
            return new Request(request, {
                headers
            })
        }
        return true
    }

    async postHandle(request: Request, response: Response) {
        if (!request.url.includes(`${PREV_FIX_API}`) || !request.url.endsWith("/login")) {
            return response
        }
        if (!response.ok || response.bodyUsed) {
            return response
        }
        const _respsonse = response.clone()
        const res: UserInfoResponse = await _respsonse.json()
        if (res.code === "E0001" && !!request.headers.get(this.KEY)) {
            this.clearUserTokenAndTokenStore()
        }
        if (res.code !== "0") {
            return response
        }
        this.userToken = res.data.token
        return response
    }

}

let cache: Cache
caches.open("sw_cache").then(_cache => {
    cache = _cache
})

// const repeatFetchInterceptor = new RepeatFetchInterceptor()
const httpRequestAuthorizationInterceptor = new HttpRequestAuthorizationInterceptor()
const interceptors: Interceptor[] = [
    // repeatFetchInterceptor,
    httpRequestAuthorizationInterceptor,
]

class _ArrayUtils {
    static toShuffled<Data = unknown>(array: readonly Data[]) {
        const _array = array.toSorted()
        for (let i = _array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [_array[i], _array[j]] = [array[j], array[i]]
        }
        return _array
    }
}

function isRequestsEqual(request: Request, other: Request) {
    const urlEqual = request.url === other.url
    const methodEqual = request.method === other.method
    // const headersEqual = JSON.stringify([...request.headers]) === JSON.stringify([...other.headers])
    const importantHeaders = ['content-type', 'authorization']
    const headersEqual = importantHeaders.every(header => {
        return request.headers.get(header) === other.headers.get(header)
    })
    const bodyEqual = (request.method === 'POST' || request.method === 'PUT')
        ? request.body === other.body
        : true
    return urlEqual && methodEqual && headersEqual && bodyEqual
}