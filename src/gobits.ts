import _ from 'lodash';
import * as queryString from 'query-string';

import { autoForm, autoJson } from './middlewares';

type Headers = { [headerName: string]: string }
type RequestMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
type QueryParams = { [paramName: string]: string | number }

type NextFn = () => Promise<any>;
type BodyParserFn = (response: globalThis.Response) => Promise<any>;

/**
 * A middleware placed in the chain to handle the request and response.
 * There are **three stages** with **three states** of the response:
 * - On the first pass, the request object will be passed through all middlewares. (state = Pending)
 * - After the first pass, an actual request will be sent to the server. (state = Responded)
 * - After receiving the response, the response will be passed through all middlewares. (state = Completed)
 * 
 * Of course, you can also skip parts of the chain by marking the response as completed or responded.
 * The response can be marked as follows:
 * ```typescript
 * res.markAsResponded(); 
 * ``` 
 * or
 * ```
 * res.markAsCompleted(); 
 * ```
 * The middleware must return void or a promise. Therefore, the middleware can also be asynchronous
 * @example
 * ```typescript
 * const errorLogger = async (req, res, next, responded) => {
 *    if (!res.ok) {
 *       await writeToLog(`${req.url} failed with ${res.status}`);
 *    }
 *    next();
 * }
 * ```
 * 
 * @param req The Gobits request object.
 * @param res The Gobits response object.
 * @param next The next function to call. This function should be called when the middleware is done. 
 * @param responded Whether the middleware is in the first (false) or second pass (true).
 */
export type Middleware = (req: Request, res: Response, next: NextFn, responded?: boolean) => Promise<any> | void;


/**
 * Define the global options for the requests.
 * Some options can be overridden by the request options.
 * 
 * 
 * @param timeout The timeout for the request.
 * @param type The type of the request (`json` or `form`). This will be handled by the built-in middleware
 * @param useDefaultMiddlewares Use the built-in middlewares provided by gobits (cannot be overriden) 
 * @param baseUrl The base url for the request. (cannot be overriden)   
 */ 
export type GlobalOptions = {
    timeout: number;
    baseUrl: string;
    type?: string;
    useDefaultMiddlewares: boolean;
}

/**
 * An object that contains the options for a single request.
 * Those options will override the global options.
 * You can also add any custom property to this object, so that your middlewares can use it.
 * 
 * @param headers The headers to send with the request.
 * @param query The query parameters to send with the request.
 * @param body The body to send with the request.
 * @param bodyParser The parser to use to parse the body, default is `text`. Available (`text`, `blob`)
 * @param timeout The timeout for the request (in miliseconds).
 * @param type The type of the request to be handled by the middleware. If type is `json`, the middleware will automatically parse the request and response body as json.
 */
export type RequestOptions = {
    headers?: Headers;
    query?: QueryParams;
    body?: any;
    bodyParser?: keyof typeof BodyParsers | ((response: globalThis.Response) => Promise<any>);
    timeout?: number;
    type?: string;
    [p: string]: any;
}

/**
 * The Gobits request object that contains the information about the request.
 */
export class Request<T = any> {
    /**
     * The headers to be sent with the request
     */
    public headers: Headers;
    /**
     * The url of the request
     */
    public url: string;
    /**
     * The query parameters to be sent with the request, in json object format
     */
    public query: { [param: string]: string | number };
    public body: T | null;
    readonly opts: RequestOptions;
    readonly method: RequestMethod;
    constructor(url: string, method: RequestMethod, opts: RequestOptions = {}) {
        this.method = method;
        this.url = url;
        this.opts = opts;
        this.headers = opts.headers || {};
        this.query = opts.query || {};
        this.body = opts.body || null;
    }
}

enum ResponseState {
    Pending,
    Responded,
    Completed
}

/**
 * The Gobits response object
 */
export class Response<T = any>{
    /**
     * The response headers
     */
    public headers: Headers;
    /**
     * The status code of the response
     */  
    public status: number;
    /**
     * The body of the response
     */
    public body: T | null;

    private _state: ResponseState
    /**
     * @internal
     */
    _nativeResponse: globalThis.Response | null;

    constructor() {
        this.headers = {};
        this.status = 0;
        this.body = null;
        this._state = ResponseState.Pending;
        this._nativeResponse = null;
    }

    /**
     * Mark the response as responded.
     * See {@link Middleware} for more information.
     */
    markAsResponded() {
        if (this._state !== ResponseState.Pending) {
            console.warn('Response is already responded or completed');
            return;
        }
        this._state = ResponseState.Responded;
    }
    /**
     * Mark the response as completed.
     * See {@link Middleware} for more information.
     */
    markAsCompleted() {
        if (this._state === ResponseState.Completed) {
            console.warn('Response is already completed');
            return;
        }
        this._state = ResponseState.Completed;
    }

    /**
     * True if the response already passed the Responded state
     */
    public get isResponded(): boolean {
        return this._state === ResponseState.Responded || this.isCompleted;
    }

    /**
     * True if the response already passed the Completed state
     */
    public get isCompleted(): boolean {
        return this._state === ResponseState.Completed;
    }

    /**
     * True if the request was redirected 
     */
    public get redirected(): boolean {
        return this._nativeResponse?.redirected ?? false;
    }

    /**
     * True if the status code is in the 2xx range
     */
    public get ok(): boolean {
        return this.status >= 200 && this.status < 300;
    }

    /**
     * The original response object of Fetch API
     */
    public get native(): globalThis.Response | null {
        return this._nativeResponse;
    }
}

/**
 * Gobits is the object that acts as an HTTP client.
 * The default behavior can be configured using the global options when constructing the object.
 * ```typescript
 * const gobits = new Gobits({
 *    baseUrl: 'http://localhost:3000',
 *    timeout: 5000,
 *    useDefaultMiddlewares: true,
 * });
 * ```
 */
export class Gobits {
    middlewares: Middleware[] = [];
    config: GlobalOptions;

    constructor({
        baseUrl = "",
        timeout = 5000,
        useDefaultMiddlewares = true,
        type = 'json'
    } = {}) {
        if (baseUrl.length > 0 && !baseUrl.startsWith('http:') && !baseUrl.startsWith('https:')) {
            throw new Error('Base url must start with http or https, or be empty');
        }
        this.config = {
            timeout,
            baseUrl,
            useDefaultMiddlewares,
            type
        };
        this.middlewares = [];

        if (this.config.useDefaultMiddlewares) {
            this.use(autoForm());
            this.use(autoJson());
        }
    }

    /**
     * Add a middleware to the request and response pipeline
     * 
     * @param middleware - the middleware to be added
     * @returns the Gobits instance to allow chaining
     */
    use(middleware: Middleware): Gobits {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Send a GET request to the given url with the given options
     * 
     * @template T - the type of the response body, default is `any`
     * @param url - the url to be requested. If the url starts with '/', it will be appended to the base url
     * @param opts - the options to make the request (see {@link RequestOptions})
     * @returns a Promise that resolves to a Gobits Response object
     */
    get<T = any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>> {
        return this.request(url, 'GET', opts);
    }

    /**
     * Send a POST request to the given url with the given options
     * 
     * @template T - the type of the response body, default is `any`
     * @param url - the url to be requested. If the url starts with '/', it will be appended to the base url
     * @param opts - the options to make the request (see {@link RequestOptions})
     * @returns a Promise that resolves to a Gobits Response object
     */
    post<T = any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>> {
        return this.request(url, 'POST', opts);
    }

    /**
     * Send a PUT request to the given url with the given options
     *
     * @template T - the type of the response body, default is `any` 
     * @param url - the url to be requested. If the url starts with '/', it will be appended to the base url
     * @param opts - the options to make the request (see {@link RequestOptions})
     * @returns a Promise that resolves to a Gobits Response object
     */
    put<T = any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>> {
        return this.request(url, 'PUT', opts);
    }

    /**
     * Send a PATCH request to the given url with the given options
     *
     * @template T - the type of the response body, default is `any` 
     * @param url - the url to be requested. If the url starts with '/', it will be appended to the base url
     * @param opts - the options to make the request (see {@link RequestOptions})
     * @returns a Promise that resolves to a Gobits Response object
     */
    patch<T = any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>> {
        return this.request(url, 'PATCH', opts);
    }
    /**
     * Send a DELETE request to the given url with the given options
     *  
     * @template T - the type of the response body, default is `any`
     * @param url - the url to be requested. If the url starts with '/', it will be appended to the base url
     * @param opts - the options to make the request (see {@link RequestOptions})
     * @returns a Promise that resolves to a Gobits Response object
     */
    delete<T = any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>> {
        return this.request(url, 'DELETE', opts);
    }

    /**
     * Make a request to the given url with the given options. 
     * 
     * @template T - the type of the response body, default is `any`
     * @param url - the url to be requested. If the url starts with '/', it will be appended to the base url
     * @param method - the method to be used, default is GET
     * @param opts - the options to make the request (see {@link RequestOptions})
     * @returns a Promise that resolves to a Gobits Response object 
     */
    async request<T = any>(url: string, method: RequestMethod = 'GET', opts: RequestOptions = {}): Promise<Response<T | null>> {
        // Extract query parameters and construct return objects
        if (url.startsWith('/')) {
            url = this.config.baseUrl + url;
        }
        const { query: queryInUrl, url: endpoint } = queryString.parseUrl(url);
        const queryParams = _.merge(queryInUrl, opts.query || {});
        const targetUrl = queryString.stringifyUrl({
            url: endpoint,
            query: queryParams,
        });

        const req = new Request(targetUrl, method, _.merge({...this.config}, opts));
        const res = new Response<T>();

        // Pass through the middleware chain
        let next = _.reduceRight(
            this.middlewares,
            (n, middleware) => async () => await chain(middleware, req, res, n, false),
            () => Promise.resolve({}));
        await next();

        if (!res.isResponded) {
            const controller = new AbortController();
            const promise = fetch(req.url, {
                signal: controller.signal,
                ...req
            });
            const timeout = setTimeout(() => controller.abort(), opts.timeout || this.config.timeout);
            promise.finally(() => clearTimeout(timeout));

            const bodyParserOpt = opts.bodyParser ?? 'text';
            let bodyParser: BodyParserFn = BodyParsers['text'];
            if (_.isString(bodyParserOpt)) {
                const key = bodyParserOpt.toLowerCase();
                if (BodyParsers.hasOwnProperty(key)) {
                    bodyParser = BodyParsers[key];
                } else {
                    console.warn(`Body parser '${bodyParserOpt}' is not supported. Using 'text' instead.`);
                }
            } else if (_.isFunction(bodyParserOpt)) {
                bodyParser = bodyParserOpt;
            }
            const fetchResponse = await promise;
            res._nativeResponse = fetchResponse;
            res.status = fetchResponse.status
            res.headers = transformFetchHeaders(fetchResponse.headers);
            res.body = await bodyParser(fetchResponse);
            res.markAsResponded();
        }
        // Pass backwards
        if (!res.isCompleted) {
            next = _.reduceRight(
                this.middlewares,
                (n, middleware) => async () => await chain(middleware, req, res, n, true),
                () => Promise.resolve({}));
            await next();
            res.markAsCompleted();
        }
        // At this stage, we believe that some middlewares have transformed the response body into type T
        return <Response<T>>res;
    }
}

async function chain(middleware: Middleware, req: Request, res: Response, next: NextFn, responded: boolean): Promise<any> {
    if ((!responded && res.isResponded) || (responded && res.isCompleted)) {
        console.warn(`Calling next() when response is already marked as done.`);
        return Promise.resolve({});
    }
    return await middleware(req, res, next, responded);
}

function transformFetchHeaders(fetchHeaders: globalThis.Headers): Headers {
    const headers: Headers = {};
    fetchHeaders.forEach((v, k) => {
        headers[k.toLowerCase()] = v;
    });
    return headers;
}

const BodyParsers = {
    'text': (r: globalThis.Response) => r.text(),
    'blob': (r: globalThis.Response) => r.blob(),
}