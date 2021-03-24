# Swirge Finance API

API that powers [Swirge Finance](https://finance.swirge.com). You can find the repo for the frontend [here](https://github.com/swirge/swirgefi-app).

## To Run

Optional enviroment vars:

`BSC_RPC` - A custom RPC endpoint that you want to use.
`HECO_RPC` - A custom RPC endpoint for HECO. You can just leave the default one otherwise.
`FORTUBE_API_TOKEN` - A token from Fortube to use their API. If you don't have a token you will get a console warning and the Fortube APYs will be slightly smaller than in production. Everything works fine otherwise.

Afterwards just do

```
yarn
yarn start
```

## Endpoints

### Consumed by the [app](https://finance.swirge.com).

**/apy**: The main endpoint used by the frontend. It returns the APY of all the vaults in the following format.

```
{
	"swgb-maxi": 0.22448469479728606, // 22%
	"cake-cake": 2.8002377054263174, // 280%
	"cake-smart": 2.8002377054263174, // 280%
	"cake-swingby-bnb": 21.85102752680053 // 2185%
}
```

After you start the API it can take a minute or two before you can fetch the APYs. We currently log `getApys()` to the console when all the data is available.

**/prices**: All token prices under the same endpoint (crosschain).

**/lps**: All liqudity pair prices under a single endpoint (crosschain).

### Consumed by third party platforms

**/cmc**: Custom endpoint required by [CoinMarketCap](https://coinmarketcap.com/) to display our vaults in their yield farming section.
**/supply**: Used by [Coingecko](https://coingecko.com) to display BIFI's total supply and circulating supply.

### Consumed by the [dashboard](https://dashboard.swirge.com)

**/earnings**: Used to display the total and daily earnings of the platform.
**/holders**: Used to display the total number of holders. This calc takes into account users with 0 SWGb in their wallet, but SWGb staked in the reward pool.

## Contribute

Swirge Finance exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

[MIT](LICENSE).
