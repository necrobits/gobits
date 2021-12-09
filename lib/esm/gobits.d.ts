declare type Headers = {
    [headerName: string]: string;
};
declare type RequestMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
declare type QueryParams = {
    [paramName: string]: string | number;
};
export declare type Request<T = any> = {
    headers: Headers;
    url: string;
    query: {
        [param: string]: string | number;
    };
    body: T | null;
    readonly opts: RequestOptions;
    readonly method: RequestMethod;
};
export declare type Response<T = any> = {
    headers: Headers;
    status: number;
    ok: boolean;
    body: T | null;
    responded: boolean;
    completed: boolean;
    _nativeResponse: globalThis.Response | null;
};
declare type NextFn = () => Promise<any>;
export declare type Middleware = (req: Request, res: Response, next: NextFn, responding?: boolean) => Promise<any> | void;
declare type GlobalOptions = {
    timeout: number;
    baseUrl: string;
    type?: string;
    useDefaultMiddlewares: boolean;
};
declare type RequestOptions = {
    headers?: Headers;
    query?: QueryParams;
    body?: any;
    responseParser?: string;
    timeout?: number;
    type?: string;
    [p: string]: any;
};
export declare class Gobits {
    middlewares: Middleware[];
    config: GlobalOptions;
    constructor({ baseUrl, timeout, useDefaultMiddlewares, type }?: {
        baseUrl?: string | undefined;
        timeout?: number | undefined;
        useDefaultMiddlewares?: boolean | undefined;
        type?: string | undefined;
    });
    use(middleware: Middleware): Gobits;
    get<T = any>(url: string, opts?: RequestOptions): Promise<Response<T | null>>;
    post<T = any>(url: string, opts?: RequestOptions): Promise<Response<T | null>>;
    put<T = any>(url: string, opts?: RequestOptions): Promise<Response<T | null>>;
    patch<T = any>(url: string, opts?: RequestOptions): Promise<Response<T | null>>;
    delete<T = any>(url: string, opts?: RequestOptions): Promise<Response<T | null>>;
    _request<T = any>(url: string, method: RequestMethod, options: RequestOptions): Promise<Response<T | null>>;
}
export {};
