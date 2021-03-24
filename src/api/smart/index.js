const BigNumber = require('bignumber.js');
const { bscWeb3: web3 } = require('../../utils/web3');

const SmartChef = require('../../abis/SmartChef.json');
const StrategySmartCake = require('../../abis/StrategySmartCake.json');
const fetchPrice = require('../../utils/fetchPrice');
const getTotalStakedInUsd = require('../../utils/getTotalStakedInUsd');
const { compound } = require('../../utils/compound');
const cakePools = require('../../data/cakePools.json');
const { HOURLY_HPY } = require('../../../constants');

const getSmartcakeData = async ctx => {
  try {
    const smartcakePools = {
      'cake-hard': 0,
      'cake-twt': 2,
    };
    const currentPool = await getCurrentPool();
    const smartcakeStakeInUsd = await getSmartcakeStakeInUsd(cakePools, currentPool);

    let smartcakeData = {
      poolId: 0,
      expectedApy: 0,
    };

    let apys = {};

    let promises = [];
    cakePools.forEach(pool =>
      promises.push(getExpectedApy(pool, smartcakeStakeInUsd, currentPool))
    );
    const values = await Promise.all(promises);

    for (item of values) {
      apys = { ...apys, ...item };
    }

    for (const key in apys) {
      if (apys[key] > smartcakeData.expectedApy) {
        if (smartcakePools[key] !== undefined) {
          smartcakeData.poolId = smartcakePools[key];
          smartcakeData.expectedApy = apys[key];
        }
      }
    }

    ctx.status = 200;
    ctx.body = smartcakeData;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
  }
};

const getExpectedApy = async (pool, smartcakeStakeInUsd, currentPool) => {
  const cake = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';

  let [yearlyRewardsInUsd, totalStakedInUsd] = await Promise.all([
    getYearlyRewardsInUsd(pool.smartChef, pool.oracle, pool.oracleId, pool.decimals),
    getTotalStakedInUsd(pool.smartChef, cake, 'coingecko', 'pancakeswap-token'),
  ]);

  if (currentPool == pool.smartcakePoolId) {
    smartcakeStakeInUsd = new BigNumber(0);
  }

  const simpleApy = yearlyRewardsInUsd.dividedBy(totalStakedInUsd.plus(smartcakeStakeInUsd));
  const apy = compound(simpleApy, HOURLY_HPY, 1, 0.94);

  return { [pool.name]: apy };
};

const getYearlyRewardsInUsd = async (smartChefAddr, oracle, oracleId, decimals) => {
  const smartChefContract = new web3.eth.Contract(SmartChef, smartChefAddr);

  const currentBlock = await web3.eth.getBlockNumber();
  const bonusEndBlock = await smartChefContract.methods.bonusEndBlock().call();
  const isPoolRunning = currentBlock <= bonusEndBlock;

  if (!isPoolRunning) return new BigNumber(0);

  const blockRewards = new BigNumber(await smartChefContract.methods.rewardPerBlock().call());
  const secondsPerBlock = 3;
  const secondsPerYear = 31536000;
  const yearlyRewards = blockRewards.dividedBy(secondsPerBlock).times(secondsPerYear);
  const earnedAssetPrice = await fetchPrice({ oracle, id: oracleId });
  const yearlyRewardsInUsd = yearlyRewards.times(earnedAssetPrice).dividedBy(decimals);
  return yearlyRewardsInUsd;
};

const getSmartcakeStakeInUsd = async (pools, currentPool) => {
  let currentSmartchef;

  pools.forEach(pool => {
    if (currentPool == pool.smartcakePoolId) {
      currentSmartchef = pool.smartChef;
    }
  });

  const smartChefContract = new web3.eth.Contract(SmartChef, currentSmartchef);
  const smartcakeInfo = await smartChefContract.methods
    .userInfo('0xBD8ad0F6492DA660f506fB65f049A5DA4b894a27')
    .call();
  const smartcakeTvl = new BigNumber(smartcakeInfo.amount);
  const tokenPrice = await fetchPrice({ oracle: 'pancake', id: 'Cake' });

  return smartcakeTvl.times(tokenPrice).dividedBy('1e18');
};

const getCurrentPool = async () => {
  const strategy = new web3.eth.Contract(
    StrategySmartCake,
    '0xBD8ad0F6492DA660f506fB65f049A5DA4b894a27'
  );
  const currentPool = await strategy.methods.currentPool().call();
  return currentPool;
};

module.exports = { getSmartcakeData };
