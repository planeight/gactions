/**
* Used for creating test and / or mock objects for Assistant in a local context
* @class
*/
class ActionTest {

  /**
  * @param {String} assistantName Desired invocation name for testing
  * @param {String} intentName The intent you're testing
  * @param {Object} query Key-value pairs of desired SchemaOrg variables
  * @return {ActionTest}
  */
  constructor(assistantName, intentName, query) {
    this.assistantName = assistantName;
    this.intentName = intentName;
    this.query = query;
  }

  /**
  * Creates the mock object
  * @return {Object}
  */
  toObject() {

    let message = `[TEST REQUEST (${JSON.stringify(this.query)})]`;
    let args = Object.keys(this.query).reduce((arr, key) => {
      return {
        name: key,
        raw_text: this.query[key],
        text_value: this.query[key]
      };
    }, []);

    return {
      inputs: [
        {
          intent: this.intentName,
          raw_inputs: [
            {
              input_type: 2,
              query: `tell ${this.assistantName} ${message}`,
              annotation_sets: []
            }
          ],
          arguments: [
            {
              name: 'trigger_query',
              raw_text: message,
              text_value: message
            }
          ].concat(args)
        }
      ],
      user: {
        user_id: 'XXXXXXXXXXXXXXXX',
      },
      conversation: {
        conversation_id: '1000000000000',
        type: 1
      }
    };

  }


}

module.exports = ActionTest;
