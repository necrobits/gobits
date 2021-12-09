import _ from 'lodash';
import * as queryString from 'query-string';

import { autoUrlEncodedForm, autoJson } from './middlewares';

type Headers = {[headerName:string]: string}
type RequestMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
type QueryParams = {[paramName: string]: string | number}

type NextFn = () => Promise<any>;
export type Middleware = (req: Request, res: Response, next: NextFn, responding?: boolean) => Promise<any> | void;

type GlobalOptions = {
    timeout: number;
    baseUrl: string;
    type?: string;
    useDefaultMiddlewares: boolean;
}

type RequestOptions = {
    headers?: Headers;
    query?: QueryParams;
    body?: any;
    responseParser?: string;
    timeout? : number;
    type?: string;
    [p: string]: any;
}

class Request<T=any> {
    public headers: Headers;
    public url: string;
    public query: {[param:string]: string | number};
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

class Response<T=any>{
    public headers: Headers;
    public status: number;
    public body: T | null;

    private _state: ResponseState
    _nativeResponse: globalThis.Response | null;

    constructor(){
        this.headers = {};
        this.status = 0;
        this.body = null;
        this._state = ResponseState.Pending;
        this._nativeResponse = null;
    }

    markAsResponded() {
        if (this._state !== ResponseState.Pending) {
            console.warn('Response is already responded or completed');
            return;
        }
        this._state = ResponseState.Responded;
    }

    markAsCompleted() {
        if (this._state === ResponseState.Completed) {
            console.warn('Response is already completed');
            return;
        }
        this._state = ResponseState.Completed;
    }

    public get isResponded(): boolean { 
        return this._state === ResponseState.Responded || this.isCompleted;
    }

    public get isCompleted(): boolean {
        return this._state === ResponseState.Completed;
    }

    public get redirected(): boolean {
        return this._nativeResponse?.redirected ?? false;
    }
    
    public get ok(): boolean {
        return this.status >= 200 && this.status < 300;
    }

    public get native(): globalThis.Response | null {
        return this._nativeResponse;
    }
}

export class Gobits{
    middlewares: Middleware[] = [];
    config: GlobalOptions;

    constructor({
        baseUrl = "",
        timeout = 5000,
        useDefaultMiddlewares = true,
        type = 'json'
    } = {}){
        this.middlewares = [];
        this.config = {
            timeout,
            baseUrl,
            useDefaultMiddlewares,
            type
        };
        if (this.config.useDefaultMiddlewares){
            this.middlewares.push(autoUrlEncodedForm());
            this.middlewares.push(autoJson());
        }
    }

    use(middleware: Middleware): Gobits{
        this.middlewares.push(middleware);
        return this;
    }

    get<T=any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>>{
        return this._request(url, 'GET', opts);
    }    

    post<T=any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>>{   
        return this._request(url, 'POST', opts);
    }

    put<T=any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>>{
        return this._request(url, 'PUT', opts); 
    }

    patch<T=any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>>{
        return this._request(url, 'PATCH', opts);
    }

    delete<T=any>(url: string, opts: RequestOptions = {}): Promise<Response<T | null>>{
        return this._request(url, 'DELETE', opts);
    }

    async _request<T=any>(url: string, method: RequestMethod, options: RequestOptions): Promise<Response<T | null>>{
        // Extract query parameters and construct return objects
        const {query: queryInUrl, url: endpoint} = queryString.parseUrl(url);
        const queryParams = _.merge(queryInUrl, options.query || {});
        const targetUrl = queryString.stringifyUrl({
            url: endpoint,
            query: queryParams,
        });

        const req = new Request(targetUrl, method, _.merge(this.config, options)); 
        const res = new Response<T>();

        // Pass through the middleware chain
        let next = _.reduceRight(
            this.middlewares,
            (n, middleware) => async () => await chain(middleware,req, res, n, false),
            ()=>Promise.resolve({}));
        await next();
        
        if (!res.isResponded){
            const controller = new AbortController();
            const promise = fetch(url, { 
                signal: controller.signal, 
                ...req
            });
            const timeout = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);
            promise.finally(() => clearTimeout(timeout));
            
            const responseParser = options.responseParser?.toLowerCase() || 'text';
            const fetchResponse = await promise;
            res._nativeResponse = fetchResponse;
            res.status = fetchResponse.status
            res.headers = transformFetchHeaders(fetchResponse.headers);
            res.body = await ResponseParsers[responseParser](fetchResponse);
            res.markAsResponded();
        }
        // Pass backwards
        if (!res.isCompleted){
            next = _.reduceRight(
                this.middlewares,
                (n, middleware) => async () => await chain(middleware,req, res, n, true),
                ()=>Promise.resolve({}));
            await next();
            res.markAsCompleted();
        }
        // At this stage, we believe that some middlewares have transformed the response body into type T
        return <Response<T>>res;
    }
}

async function chain(middleware: Middleware, req: Request, res: Response, next: NextFn, responding: boolean): Promise<any> {
    if ((!responding && res.isResponded) || (responding && res.isCompleted)){
        console.warn(`Calling next() when response is already marked as done.`);
        return Promise.resolve({});
    }
    return await middleware(req, res, next, responding);
}

function transformFetchHeaders(fetchHeaders: globalThis.Headers): Headers{
    const headers: Headers = {};
    fetchHeaders.forEach((v,k) => {
        headers[k.toLowerCase()] = v;
    });
    return headers;
}

const ResponseParsers = {
    'text': (r: globalThis.Response) => r.text(),
    'blob': (r: globalThis.Response) => r.blob(), 
}