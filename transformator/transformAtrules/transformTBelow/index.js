const { camelize, decamelize } = require('humps');
const { toEm } = require('../../../helpers');
const { HAS_EM, HAS_PX } = require('../../../constants/regexes');
const {
  calcBreakpointBelow,
  checkIsBreakpointName,
  getNamesOfBreakpoints,
  removeRoundBrackets,
} = require('../../../api/breakpoints');

/**
 * !!! @t-below takes the names of breakpoints, values in pixels or em.
 *
 * Checking the values of @t-below.
 * If the value contains a breakpoint name or is specified in pixels, we convert it to em.
 * If specified in em, leave it as is.
 * If the value does not match any of the specified patterns, we warn the user of the error.
 * @param {Object} atrule Css atrule.
 * @param {Object} config User configuration.
 * @return {string} @media screen and (max-with: calculated value)
 */
const calcParamsOfAtruleBelow = (atrule, config) => {
  const postcssAtrule = atrule;
  const namesOfBreakpoints = getNamesOfBreakpoints(config);
  const paramsWithoutBrackets = removeRoundBrackets(postcssAtrule.params);
  const isBreakpointName = checkIsBreakpointName(
    namesOfBreakpoints,
    camelize(paramsWithoutBrackets),
  );

  let result = null;

  try {
    if (isBreakpointName) {
      // Redo it! The function should only count the result.
      if (calcBreakpointBelow(paramsWithoutBrackets, config)) {
        result = `screen and (max-width: ${calcBreakpointBelow(
          paramsWithoutBrackets,
          config,
        )})`;
      } else {
        postcssAtrule.remove();
        const penultimateBreakName = namesOfBreakpoints
          .map(item =>
            decamelize(item, {
              separator: '-',
            }),
          )
          .filter((item, i, arr) => item === arr[arr.length - 2]);
        throw new Error(
          `
          ${paramsWithoutBrackets} is incorrect parameter in @t-below. Use ${penultimateBreakName} as a maximum breakpoint.
          `,
        );
      }
    } else if (HAS_PX.test(paramsWithoutBrackets)) {
      const breakpointValue = `${toEm(paramsWithoutBrackets)}em`;
      result = `screen and (max-width: ${breakpointValue})`;
    } else if (HAS_EM.test(paramsWithoutBrackets)) {
      result = `screen and (max-width: ${paramsWithoutBrackets})`;
    } else {
      result = '';
      postcssAtrule.remove();

      // Without the last value.
      const breakpointLine = namesOfBreakpoints
        .map(item => decamelize(item, { separator: '-' }))
        .filter((item, i, arr) => item !== arr[arr.length - 1])
        .join(', ');

      const valueWithoutBrackets = removeRoundBrackets(postcssAtrule.params);
      const exampleBreak = decamelize(namesOfBreakpoints[2], {
        separator: '-',
      });
      throw new Error(
        `
          "${valueWithoutBrackets}" is incorrect parameter of @t-below. Use "${breakpointLine}" or the value in pixels or in ems.
          For example @t-below(${exampleBreak}) or @t-below(800px) or @t-below(40em)
        `,
      );
    }
  } catch (err) {
    console.warn(err.message);
  }

  return result;
};

/**
 * Replacement @t-below with @media screen and (max-width: "blablabla")
 * @example @-below(1000px) => @media screen and (max-width: 62.5em)
 * @param {Object} atrule @t-blow atrule.
 * @param {Object} config User configuration.
 * @return {void}
 */
module.exports = (atrule, config) => {
  const postcssAtrule = atrule;
  postcssAtrule.name = 'media';
  postcssAtrule.params = calcParamsOfAtruleBelow(atrule, config);
};

/**
 * Check atrule name have a @t-below value.
 * @param {Object} atrule Css atrule.
 * @return {boolean} Contains @t-below or not.
 */
module.exports.test = atrule => atrule.name === 't-below';
