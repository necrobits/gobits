# Gobits
An extensible Javascript HTTP Client that wraps Fetch API and provides middlewares, with Typescript support.  
You can add middlewares (even asynchronous ones) to Gobits to add more features.
## Install
Using `npm`
```
npm i gobits
```
or with `yarn`
```
yarn add gobits
```
## Quick start
```typescript
const simpleAuth = (req, res, next) => {
    req.headers['Authorization'] = `Bearer ABCD-EFGH`;
    return next();
}
const responseLogger = (req, res, next, responding) => {
    if (responding){ // After receiving the response from fetch (2. pass)
        console.log('Response:', res.body);   
    }
    return next();
}

const go = new Gobits();
go.use(simpleAuth);
go.use(responseLogger);

const users = go.get<User[]>("http://restapi.adequateshop.com/api/users")
    .then(response => response.body);
```


## License
MIT