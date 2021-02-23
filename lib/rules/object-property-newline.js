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
          minProps: {
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
      let minProps = 0;

      if (option) {
        if (option === "consistent") {
          consistent = true;
          minProps = Number.POSITIVE_INFINITY;
        } else if (option === "always" || option.minProps === 0) {
          minProps = 0;
        } else if (option === "never") {
          minProps = Number.POSITIVE_INFINITY;
        } else {
          minProps = option.minProps || Number.POSITIVE_INFINITY;
        }
      } else {
        consistent = false;
        minProps = Number.POSITIVE_INFINITY;
      }

      return { consistent, minProps };
    }

    const options = normalizeOptionValue(context.options[0])

    return {
      ObjectPattern(node) {
        if (node.properties.length <= options.minProps) {
          for (let i = 1; i < node.properties.length; i++) {
            const property =node.properties[i]

            const lastPrev = sourceCode.getLastToken(node.properties[i - 1])
            const firstCurrent = sourceCode.getFirstToken(property)

            // we have a multiline, bad.
            if (lastPrev.loc.end.line !== firstCurrent.loc.start.line) {
              context.report({
                node,
                loc: firstCurrent.loc,
                messageId: 'propertiesAllOneLine',
                fix(fixer) {
                  const originalText = sourceCode.getText(firstCurrent)

                  return fixer.replaceText(property, originalText.replace('\n', '') + 'baby')
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
