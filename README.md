-----

:warning: *THIS PROJECT IS NOT OFFICIALLY SUPPORTED! ALL CODE IN HERE IS
IN DEVELOPMENT AND LIKELY TO CHANGE WITHOUT WARNING. USE AT YOUR OWN
RISK.* :warning:

-----

antiscroll-2
============

Unofficial successor of [Antiscroll](https://github.com/LearnBoost/antiscroll) with the following benefits:

- More configurable options
- Release versions
- Bower support
- Sourcemap files
- Stylesheets written in Less
- Cross-browser support using [LESS Hat](https://github.com/madebysource/lesshat)
- Documentation according to JSDoc 3
- Various Antiscroll bug fixes

## Usage

```javascript
$(element).antiscroll(options);
```

## Options

```
{
  autoHide: <boolean>
  autoResize: <boolean>
  autoWrap: <boolean>
  debug: <boolean>
  marginTop: <number>
  notHorizontal: <boolean>
  notVertical: <boolean>
  notOnMacintosh: <boolean>
  notOnWindows: <boolean>
  onlyOnWindows: <boolean>
  padding: <number>
  startBottom: <boolean>
}
```

## Development

```bash
npm install
npm start
```
