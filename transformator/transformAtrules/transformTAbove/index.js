const { camelize, decamelize } = require('humps');
const { toEm } = require('../../../helpers');
const { HAS_EM, HAS_PX } = require('../../../constants/regexes');
const {
  breakpointsToCebabCase,
  calcBreakpointAbove,
  checkIsBreakpointName,
  getNamesOfBreakpoints,
  removeRoundBrackets,
} = require('../../../api/breakpoints');

/**
 *  !!! @t-above takes the names of breakpoints, values in pixels or em.
 *
 * The function converts the value of @ t-above depending on its contents.
 * If these are breakpoint names or the value contains pixels, we convert them to em,
 * if the value is specified in em, we output the value as is.
 * If the value does not match one of the conditions, we warn the user about the error.
 *
 * @param {Object} atrule Css atrule.
 * @param {Object} config User configuration.
 * @return {string} String with "min-width: " value convertible to em.
 */
const calcParamsOfAtruleAbove = (atrule, config) => {
  const postcssAtrule = atrule;
  const namesOfBreakpoints = getNamesOfBreakpoints(config);
  const paramsWithoutBrackets = camelize(
    removeRoundBrackets(postcssAtrule.params),
  );
  const isBreakpointName = checkIsBreakpointName(
    namesOfBreakpoints,
    paramsWithoutBrackets,
  );

  let result = null;

  try {
    if (isBreakpointName) {
      result = `screen and (min-width: ${calcBreakpointAbove(
        paramsWithoutBrackets,
        config,
      )})`;
    } else if (HAS_PX.test(paramsWithoutBrackets)) {
      const breakpointValue = `${toEm(paramsWithoutBrackets)}em`;
      result = `screen and (min-width: ${breakpointValue})`;
    } else if (HAS_EM.test(paramsWithoutBrackets)) {
      result = `screen and (min-width: ${paramsWithoutBrackets})`;
    } else {
      result = '';
      postcssAtrule.remove();
      const breakpointLine = breakpointsToCebabCase(namesOfBreakpoints);
      const valueWithoutBrackets = removeRoundBrackets(postcssAtrule.params);
      const exampleBreak = decamelize(namesOfBreakpoints[2], {
        separator: '-',
      });
      throw new Error(
        `
          "${valueWithoutBrackets}" is invalid argument of @t-above. Use "${breakpointLine}" or the value in pixels or in ems. 
          For example @t-above(${exampleBreak}) or @t-above(800px) or @t-above(40em).
        `,
      );
    }
  } catch (err) {
    console.warn(err.message);
  }
  return result;
};

/**
 * Replacement @t-above with @media screen and (min-width: "blablabla")
 *
 * @example @t-above(1000px) => @media screen and (min-width: 62.5em)
 * @param {Object} atrule Css atrule.
 * @param {*} config User configuration.
 * @return {void}
 */
module.exports = (atrule, config) => {
  const postcssNode = atrule;
  postcssNode.name = 'media';
  postcssNode.params = calcParamsOfAtruleAbove(atrule, config);
};

/**
 * Check for content in the name atrule the values of t-above.
 *
 * @param {Object} atrule Css atrule.
 * @return {boolean} Contains or not.
 */
module.exports.test = atrule => atrule.name === 't-above';
