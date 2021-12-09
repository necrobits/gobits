import _ from 'lodash';
import {Middleware} from './gobits';

export function autoUrlEncodedForm(){
    return <Middleware>((req, _, next, responding) => {
        if (!responding && req.opts.type?.toLowerCase() === 'form'){
            req.headers['content-type'] = 'application/x-www-form-urlencoded';
        }
        return next();
    });  
}

export function autoJson(){
    return <Middleware>((req, res, next, responding) => {
        if (!responding && req.opts.type?.toLowerCase() === 'json' && req.body && !_.isString(req.body)){
            req.body = JSON.stringify(req.body);
            if (!req.headers.hasOwnProperty('content-type')){
                req.headers['content-type'] = 'application/json';
            }
            if (!req.headers.hasOwnProperty('accept')){
                req.headers['accept'] = 'application/json';
            }
        }
        if (responding && res.headers['content-type']?.includes('application/json') && res.body){
            res.body = JSON.parse(res.body);
        }
        return next();
    });
}