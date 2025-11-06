# Figure Markets HASH Price Tracker

A simple, pure Scittle/ClojureScript application that fetches and displays live HASH token prices from the Figure Markets exchange.

## Features

- 🚀 **Pure Client-Side**: Runs entirely in the browser using Scittle (ClojureScript interpreter)
- 📊 **Live Data**: Fetches real-time HASH price data from Figure Markets API
- 🔄 **Auto-Refresh**: Updates price data every 30 seconds
- 💎 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- 📈 **Complete Market Data**: Shows price, 24h change, volume, bid/ask spread, and more

## Requirements

- **Internet Connection**: Required to load dependencies from CDNs (Scittle, React, Tailwind CSS) and fetch live data from Figure Markets API
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (with JavaScript enabled)

## Usage

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

- **Current Price**: Mid-market price for HASH-USD
- **24h Change**: Percentage change over the last 24 hours
- **24h Volume**: Total trading volume in USD
- **24h High/Low**: Price range over the last 24 hours
- **Order Book**: Current best bid and ask prices
- **Last Trade**: Most recent trade price
- **Spread**: Difference between best bid and ask
- **Trade Count**: Number of trades in the last 24 hours

## Technologies

- **Scittle**: ClojureScript interpreter for the browser
- **Reagent**: ClojureScript interface to React
- **Tailwind CSS**: Utility-first CSS framework
- **Figure Markets API**: Real-time cryptocurrency market data

## Source Code

- `index.html`: Main HTML file with Scittle dependencies
- `src/fm_wallet.cljs`: ClojureScript application code
- `test-cdn.html`: Simple connectivity test for CDN resources

## Troubleshooting

### App Hangs at "Loading HASH price..."

This usually means CDN resources failed to load. Check:

1. **Internet Connection**: Ensure you have an active internet connection
2. **Firewall/Proxy**: Corporate firewalls or proxies may block CDNs
   - Required domains: `cdn.tailwindcss.com`, `cdn.jsdelivr.net`, `unpkg.com`, `figuremarkets.com`
3. **Browser Console**: Open DevTools (F12) and check for errors
4. **Test CDN Connectivity**: Open `test-cdn.html` to verify CDN access

### Deploying to GitHub Pages

The app works best when deployed to GitHub Pages because:
- No network restrictions for end users
- Direct CDN access from users' browsers
- Reliable hosting for static content

See `GITHUB_PAGES_SETUP.md` for deployment instructions.

## License

MIT

## Credits

Based on functionality from [figure-fm-hash-prices](https://github.com/franks42/figure-fm-hash-prices), simplified to focus on just HASH price display.