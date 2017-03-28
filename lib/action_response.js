/**
* Used to transparently format an object response (passed as application/json
*   over HTTP) to Google Assistant
* @class
*/
class ActionResponse {

  /**
  * The basic constructor for ActionResponse. Please see:
  *   https://developers.google.com/actions/reference/conversation
  *   for more information.
  *
  *   NOTE: expect_user_response is handled gracefully --- if no `prompts`
  *     are provided, a final response is assumed.
  *
  * @param {Error} err An error object, if the response has failed in any way
  * @param {String|Object} message A basic string response or {ssml: "my ssml"} Object
  * @param {Array} prompts An array of string prompts to encourage user input
  * @param {Array} intents a list of possible intent names to route to after further interaction
  * @return {ActionResponse}
  */
  constructor(err, message, prompts, intents) {

    this.error = err;
    this.message = message;
    this.prompts = prompts instanceof Array ? prompts : null;
    this.intents = intents instanceof Array ? intents : [];
    this.expectUserResponse = err ? false : !!prompts;

    if (this.expectUserResponse && !this.intents.length) {
      this.error = new Error('No possible intents given for continued response');
    }

  }

  /**
  * Gracefully format errors to return a normal Assistant response
  * @param {Error} err
  * @return {Object}
  */
  formatSpeechResponseError(err) {
    return this.formatSpeechResponse(`There was an error with your request, ${err.message}`);
  }

  /**
  * Return a speechResponse object from a string or Object
  * @param {String|Object} message Message to reply with
  * @return {Object}
  */
  formatSpeechResponse(message) {
    if (typeof message === 'object' && message) {
      if (!message.ssml) {
        return {text_to_speech: `Invalid Speech Response: Must be String or Object containing "ssml" field.`};
      } else {
        return {ssml: message.ssml};
      }
    } else {
      return {text_to_speech: message || 'No response provided'};
    }
  }

  /**
  * Format expectedIntent for `possible_intents` field
  * @param {String} intentName Full intent name
  */
  formatExpectedIntent(intentName) {
    return {intent: intentName};
  }

  /**
  * Outputs full Assistant Response, with optional state (conversationToken)
  *   parameters
  * @param {Object} conversationToken maintains state between responses (assistant send it back)
  * @return {Object}
  */
  toObject(conversationToken) {

    conversationToken = typeof conversationToken === 'object' ?
      (conversationToken || {}) :
      {};

    if (this.error) {

      return {
        conversation_token: JSON.stringify(conversationToken),
        expect_user_response: false,
        final_response: {
          speech_response: this.formatSpeechResponseError(this.error)
        }
      };

    } else if (!this.expectUserResponse) {

      return {
        conversation_token: JSON.stringify(conversationToken),
        expect_user_response: false,
        final_response: {
          speech_response: this.formatSpeechResponse(this.message)
        }
      };

    } else {

      return {
        conversation_token: JSON.stringify(conversationToken),
        expect_user_response: true,
        expected_inputs: [
          {
            input_prompt: {
              initial_prompts: [
                this.formatSpeechResponse(this.message)
              ],
              no_input_prompts: this.prompts.map(message => this.formatSpeechResponse(message))
            },
            possible_intents: this.intents.map(intent => this.formatExpectedIntent(intent))
          }
        ]
      };

    }

  }

}

module.exports = ActionResponse;
