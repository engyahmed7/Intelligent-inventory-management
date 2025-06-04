const papaparse = require("papaparse");
const fs = require("fs");

/**
 * Parses CSV data from a string or stream.
 * @param {string | NodeJS.ReadableStream} csvInput - CSV string or readable stream.
 * @param {object} options - PapaParse options (e.g., { header: true, skipEmptyLines: true }).
 * @returns {Promise<object[]>}
 */
const parseCsv = (csvInput, options = {}) => {
  return new Promise((resolve, reject) => {
    papaparse.parse(csvInput, {
      header: true, 
      skipEmptyLines: true,
      dynamicTyping: true, 
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV Parsing Errors:", results.errors);
          reject(new Error(`CSV parsing failed: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
      ...options, 
    });
  });
};

/**
 * Converts an array of objects to a CSV string.
 * @param {object[]} data - Array of objects.
 * @param {object} options - PapaParse unparse options.
 * @returns {string}
 */
const unparseCsv = (data, options = {}) => {
  return papaparse.unparse(data, {
    header: true,
    ...options,
  });
};

module.exports = {
  parseCsv,
  unparseCsv,
};

