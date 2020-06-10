# Pacem.Apps
Ongoing implementation of 
a [Squirrel](https://github.com/Squirrel) 
release server (mostly for [Electron](https://www.electronjs.org/) 
applications), written in ASP.Net Core 3.1+.

### The Big Picture
This WebApp aims to provide the endpoints that your Squirrel-powered app needs in order to:

- check for updates;
- download the updates;
- check for version existence.

As you can see through the code, this default implementation exploits the
[Azure Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/)
and their API.

Currently tested on Windows platform only.

#### Check-for-Updates endpoint

Route:
```
/{product}/{platform}/{architecture}/{version}/updates/RELEASES
```

When using `autoUpdater` in your application, just set:
```js

// ReleaseServer/{product}/{platform}/{arch}/{currentAppVersion}/updates
autoUpdater.setFeedURL('https://server/my-glorious-app/win32/x64/0.0.1/updates');
```

#### Check-for-Version endpoint

Route:
```
/check/{product}/{platform}/{architecture}/{version}
```

Returns a `200` status if the version exists, otherwise a `404`.

> This endpoint is not related to a Squirrel-relevant use case

Nevertheless might be useful (e.g. when checked in a DevOps product release pipeline).

#### Full-Download endpoint

Route:
```
/download/{product}/{platform}/{architecture}
```

Redirects to the full download url (e.g: _.exe_) of the `product`'s **latest version**.  
If no matching app is found, you get a `404`.
