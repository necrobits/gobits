import _ from 'lodash';
import * as queryString from 'query-string';

import { autoUrlEncodedForm, autoJson } from './middlewares';

type Headers = {[headerName:string]: string}
type RequestMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
type QueryParams = {[paramName: string]: string | number}
export type Request<T=any> = {
    headers: Headers;
    url: string;
    query: {[param:string]: string | number};
    body: T | null;
    readonly opts: RequestOptions;
    readonly method: RequestMethod;
}

export type Response<T=any> = {
    headers: Headers;
    status: number;
    ok: boolean;
    body: T | null;
    responded: boolean;
    completed: boolean;
    _nativeResponse: globalThis.Response | null;
}

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

        let req: Request = {
            url: targetUrl,
            headers: options.headers || {},
            query: queryParams,
            body: options.body || null,
            opts: _.merge(this.config, options),
            method: method
        };
        let res: Response = {
            headers: {},
            status: 0,
            ok: false,
            body: null,
            responded: false,
            completed: false,
            _nativeResponse: null
        }

        // Pass through the middleware chain
        let next = _.reduceRight(
            this.middlewares,
            (n, middleware) => async () => await chain(middleware,req, res, n, false),
            ()=>Promise.resolve({}));
        await next();
        
        if (!res.responded){
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
            res.ok = fetchResponse.ok;
            res.responded = true;
        }
        // Pass backwards
        if (!res.completed){
            next = _.reduce(
                this.middlewares,
                (n, middleware) => async () => await chain(middleware,req, res, n, true),
                ()=>Promise.resolve({}));
            await next();
            res.completed = true;
        }
        res.ok = res.status >= 200 && res.status < 300;
        // At this stage, we believe that some middlewares have transformed the response body into type T
        return <Response<T>>res;
    }
}

async function chain(middleware: Middleware, req: Request, res: Response, next: NextFn, responding: boolean): Promise<any> {
    if ((!responding && res.responded) || (responding && res.completed)){
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