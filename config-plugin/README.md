### inject some json config to app

# create file  .configPlugin.json


``` json

{
    "tradeScopeConfig": {
        "trade1": "btc"
    },
    "walletScopeConfig": {
        "address": "test"
    }
}

```

# config babel.config.js or other babel config

``` js

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:@d2c2d/config-plugin',
        {
          // moduleName: '@ConfigPlugin',
          // path: '.configPlugin.json',
          verbose: false,
        },
      ],
    ],
  };
};


``` 

# import scopeValue

```
 import {tradeScopeConfig} from "@ConfigPlugin"
 
console.log("tradeScopeConfig:", tradeScopeConfig)

```


# rn project metro config

``` js

// metro.config.js
const {getFilesHash} = require("@d2c2d/config-plugin")

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot, {
  // Disable CSS support.
});
config.cacheVersion = getFilesHash([".configPlugin.json"])


```