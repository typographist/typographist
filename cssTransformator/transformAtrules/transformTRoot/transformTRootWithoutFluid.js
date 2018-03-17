const { mediaAtrule } = require('../../atrules');
const { removeRoundBrackets } = require('../../../utils/breakpoints');
const { FIRST_BREAKPOINT } = require('../../../constants');
const { variableDecl, fontSizeDecl } = require('../../decls');
const getRootRule = require('./getRootRule');
const { percentage } = require('../../../helpers');

module.exports = (node, breakpoints) => {
  const { parent } = node;
  const defaultBreakpoint = breakpoints.find(b =>
    FIRST_BREAKPOINT.test(b.value),
  );

  breakpoints
    .filter(b => b.value !== '0px')
    .reverse()
    .map(b =>
      parent.after(
        mediaAtrule({
          minWidth: b.value,
          nestedRule: getRootRule().append(
            fontSizeDecl(`${percentage(b.root)}%`),
          ),
        }),
      ),
    );
  breakpoints.filter(b => b.value !== '0px').map(b =>
    node.before(
      variableDecl({
        name: b.name,
        value: b.value,
      }),
    ),
  );
  const fontSize = `${percentage(defaultBreakpoint.root)}%`;
  node.replaceWith(fontSizeDecl(fontSize));
};

module.exports.test = node => {
  const { parent } = node;
  const isRootRule = parent.selector === ':root';
  const hasFluid = removeRoundBrackets(node.params) === 'fluid';

  return [parent, isRootRule, !hasFluid].every(Boolean);
};