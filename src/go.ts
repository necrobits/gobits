import _ from 'lodash';

type Headers = {[headerName:string]: string}

type Request<T=any> = {
    headers: Headers;
    url: string;
    query: {[param:string]: string | number};
    body: T | null;
}

type Response<T=any> = {
    headers: Headers;
    status: number;
    data: T | null;
    error?: Error;
}

type RequestMiddleware = (req: Request) => Request;
type ResponseMiddleware = (res: Response) => Response;

type GlobalOptions = {
    timeout: number;
    baseUrl: string;
}

type RequestOptions = {
    headers?: Headers;
    timeout? : number;
}

export class Gobits{
    reqMiddlewares: RequestMiddleware[] = [];
    resMiddlewares: ResponseMiddleware[] = [];
    config: GlobalOptions;

    constructor(){
        this.reqMiddlewares = [];
        this.resMiddlewares = [];
        this.config = {
            timeout: 5000,
            baseUrl:""
        }
    }

    get<T=any>(url: string,): Promise<T | null>{
        return Promise.resolve(null);
    }    

    post<T=any>(): Promise<T | null>{
        return Promise.resolve(null);
    }

    put<T=any>(): Promise<T | null>{
        return Promise.resolve(null);
    }

    patch<T=any>(): Promise<T | null>{
        return Promise.resolve(null);
    }

    delete<T=any>(): Promise<T | null>{
        return Promise.resolve(null);
    }

    _request<T=any>(, {}): Promise<T | null>{
        const controller = new AbortController();
        const promise = fetch(url, { signal: controller.signal, ...options })
            .then(response => ({
                status: response.status,
            }));
        const timeout = setTimeout(() => controller.abort(), ms);
        return promise.finally(() => clearTimeout(timeout));
    }
}