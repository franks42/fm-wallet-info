# Figure Markets Simple Wallet Info

A simple, pure Scittle/ClojureScript application that fetches and displays live wallet account info from the Figure Markets exchange.

## Features

- 🚀 **Pure Client-Side**: Runs entirely in the browser using Scittle (ClojureScript interpreter)
- 📊 **Live Data**: Fetches real-time HASH price data from Figure Markets API

## Requirements

- **Internet Connection**: Required to load dependencies from CDNs (Scittle, React, Tailwind CSS) and fetch live data from Figure Markets API
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (with JavaScript enabled)

## Usage

Github pages serves the whole app:

https://franks42.github.io/fm-wallet-info/


For local testing:

Simply open `index.html` in a web browser or serve it with any static file server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server

# Or just open index.html in your browser
```

Then navigate to `http://localhost:8080` in your browser.

## How It Works

1. **No Build Step Required**: The ClojureScript code is interpreted directly in the browser using Scittle
2. **Direct API Access**: Fetches data from `https://www.figuremarkets.com/service-hft-exchange/api/v1/markets`
3. **Reactive UI**: Built with Reagent (React wrapper for ClojureScript) for smooth, reactive updates

## API Endpoint

The app fetches data from the Figure Markets public API:

```
GET https://www.figuremarkets.com/service-hft-exchange/api/v1/markets
```

This returns market data for all trading pairs, and the app filters for the HASH-USD pair.

## Data Displayed


## Technologies

- **Scittle**: ClojureScript interpreter for the browser
- **Reagent**: ClojureScript interface to React
- **Tailwind CSS**: Utility-first CSS framework
- **Figure Markets API**: Real-time cryptocurrency market data

## Source Code


## Troubleshooting


### Deploying to GitHub Pages

The app works best when deployed to GitHub Pages because:
- No network restrictions for end users
- Direct CDN access from users' browsers
- Reliable hosting for static content

See `GITHUB_PAGES_SETUP.md` for deployment instructions.

## License

EPL 2.0

## Credits

