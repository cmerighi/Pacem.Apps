# Pacem.Apps
Ongoing implementation of 
a [Squirrel](https://www.electronjs.org/docs/api/auto-updater) 
release server (mostly for [Electron](https://www.electronjs.org/) 
applications), written in ASP.Net Core 3.1+.

### The Big Picture
Give consumable endpoints to your Squirrel-powered app, in order to:

- check for updates;
- download the updates;
- check for version existence.

#### Check-for-Updates endpoint

Path:
```
/{product}/{platform}/{architecture}/{version}/updates/RELEASES
```

When using `autoUpdater` in your application, just set:
```js

// ReleaseServer/{product}/{platform}/{arch}/{currentAppVersion}/updates
autoUpdater.setFeedURL('https://server/my-glorious-app/win32/x64/0.0.1/updates');
```

#### Check-for-Version endpoint

Path:
```
/check/{product}/{platform}/{architecture}/{version}
```

Returns a `200` status if the version exists, otherwise a `404`.

> This endpoint is not related a Squirrel-relevant use case

Nevertheless might be useful (e.g. when checked in a DevOps product release pipeline).