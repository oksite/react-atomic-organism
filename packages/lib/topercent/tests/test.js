'use strict';

import toPercent, {percent, round, toNum, toInt} from '../cjs/src/index.js';
import {expect} from 'chai';

describe('Test to percent', () => {
  const n = 1;
  it('To string', () => {
    expect(toPercent(n)).to.equal('100.00%');
  });
});

describe('Test round', () => {
  it('Test float', () => {
    expect(round(2.225)).to.equal('2.23');
  });
  it('Test int', () => {
    expect(round(1)).to.equal('1.00');
  });
  it('Test float string', () => {
    expect(round('2.225')).to.equal('2.23');
  });
  it('Test int string', () => {
    expect(round('1')).to.equal('1.00');
  });
  it('Test 0', () => {
    expect(round(0)).to.equal('0.00');
  });
});

describe('Test percent', () => {
  it('Test 1', () => {
    expect(percent(1)).to.equal('100.00');
  });
  it('Test empty', () => {
    expect(percent(undefined)).to.equal('0.00');
  });
});

describe('to num', () => {
  it('Test bool', () => {
    expect(toNum(true)).to.equal(1);
    expect(toNum(false)).to.equal(0);
  });
  it('Test empty', () => {
    expect(toNum([])).to.equal(0);
    expect(toNum(null)).to.equal(0);
    expect(toNum('')).to.equal(0);
  });
  it('Test int', () => {
    expect(toNum(1)).to.equal(1);
  });
  it('Test float', () => {
    expect(toNum(1.1)).to.equal(1.1);
  });
  it('Test int string', () => {
    expect(toNum('1')).to.equal(1);
  });
  it('Test float string', () => {
    expect(toNum('1.1')).to.equal(1.1);
  });
  it('Test Hexadecimal', () => {
    expect(toNum(0xa)).to.equal(10);
  });
  it('Test 4.89e7', () => {
    expect(toNum(4.89e7)).to.equal(48900000);
    expect(toNum('4.89e7')).to.equal(48900000);
  });
  it('Test 100.01f', () => {
    expect(toNum('100.01f')).to.equal(100.01);
  });
});

describe('to Int', () => {
  it('Test from string', () => {
    expect(toInt('1')).to.equal(1);
  });
  it('Test from float', () => {
    expect(toInt(1.1)).to.equal(1);
    expect(toInt(1.5)).to.equal(2);
  });
  it('Test from float string', () => {
    expect(toInt('1.1')).to.equal(1);
    expect(toInt('1.5')).to.equal(2);
  });
});
