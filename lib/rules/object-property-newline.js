'use strict'

module.exports = {
  meta: {
    type: 'layout',
    messages: {
      propertiesOnNewline: 'Destructuring properties must go on a new line.',
      propertiesAllOneLine: 'Destructuring properties must all go on only one line.',
    },
    fixable: 'whitespace',
    schema: [
      {
        type: "object",
        properties: {
          maxLen: {
            type: ["integer", "null"],
            minimum: 1
          }
        }
      }
    ]
  },
  create: context => {
    const sourceCode = context.getSourceCode()

    function normalizeOptionValue(option) {
      let consistent = false;
      let maxLen = 0

      if (option) {
        if (option === "consistent") {
          consistent = true;
          maxLen = Number.POSITIVE_INFINITY;
        } else if (option === "always" || option.minProps === 0) {
          maxLen = 0;
        } else if (option === "never") {
          maxLen = Number.POSITIVE_INFINITY;
        } else {
          maxLen = option.minProps || Number.POSITIVE_INFINITY;
        }
      } else {
        consistent = false;
        maxLen = Number.POSITIVE_INFINITY;
      }

      return { consistent, maxLen };
    }

    const options = normalizeOptionValue(context.options[0])

    return {
      ObjectPattern(node) {
        const charCount = node.range[1] - node.range[0]

        if (charCount <= options.maxLen) {
          for (let i = 1; i < node.properties.length; i++) {
            const lastPrev = sourceCode.getLastToken(node.properties[i - 1])
            const firstCurrent = sourceCode.getFirstToken(node.properties[i])

            // we have a multiline, bad.
            if (lastPrev.loc.end.line !== firstCurrent.loc.start.line) {
              context.report({
                node,
                loc: firstCurrent.loc,
                messageId: 'propertiesAllOneLine',
                fix(fixer) {
                  const comma = sourceCode.getTokenBefore(firstCurrent)
                  const afterComma = [ comma.range[ 1 ], firstCurrent.range[ 0 ] ]

                  return fixer.replaceTextRange(afterComma, '')
                },
              })
            }
          }
          return
        }

        for (let i = 1; i < node.properties.length; i++) {
          const lastPrev = sourceCode.getLastToken(node.properties[ i - 1 ])
          const firstCurrent = sourceCode.getFirstToken(node.properties[ i ])

          if (lastPrev.loc.end.line === firstCurrent.loc.start.line) {
            context.report({
              node,
              loc: firstCurrent.loc,
              messageId: 'propertiesOnNewline',
              fix(fixer) {
                const comma = sourceCode.getTokenBefore(firstCurrent)
                const afterComma = [ comma.range[ 1 ], firstCurrent.range[ 0 ] ]

                return fixer.replaceTextRange(afterComma, '\n')
              },
            })
          }
        }
      },
    }
  },
}
