'use strict';

function unique(array) {
  const result = [];
  const hash = {};

  for (let i = 0, length = array.length; i < length; i++) {
    const item = array[i];
    const key = item;
    if (hash[key]) {
      if (hash[key] >= 1) hash[key] += 1;
    } else {
      result.push(item);
      hash[key] = 1;
    }
  }
  return {
    result,
    hash
  };
}

module.exports = {
  unique
}