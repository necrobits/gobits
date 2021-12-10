import _ from 'lodash';
import {Middleware} from './gobits';

/**
 * @internal
 */
export function autoForm(){
    return <Middleware>((req, _res, next, responding) => {
        if (!responding && req.opts.type?.toLowerCase() === 'form'){
            if (!req.body && req.opts.form){
                req.body = new FormData();
                _.forIn(req.opts.form, (value, key) => {
                    req.body.append(key, value);
                });
            }
        }
        return next();
    });  
}

/**
 * @internal
 */
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