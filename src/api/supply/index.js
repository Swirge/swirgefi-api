'use strict';
const axios = require('axios');

const url = 'https://app.swirge.com/supply/circulation';

const getSupply = async ()=>{
  const circulation = (await axios.get(url)).data;
  console.log(circulation);
  return circulation;
}

async function supply(ctx) {
  ctx.body = {
    total: (await getSupply()).totalSupply,
    circulating: (await getSupply()).totalCirculation
  };
}

async function total(ctx) {
  ctx.body = (await getSupply()).totalSupply;
}

async function circulating(ctx) {
  ctx.body = (await getSupply()).totalCirculation;
}
module.exports = { supply, total, circulating };
