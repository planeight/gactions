/**
* Graceful request parsing / handling
* @class
*/
class ActionParser {

  constructor() {
    this.conversationTypes = [
      'TYPE_UNSPECIFIED',
      'NEW',
      'ACTIVE',
      'EXPIRED',
      'ARCHIVED'
    ];
  }

  parseObject(value) {
    value = value || {};
    value = typeof value === 'object' ? value : {};
    return value;
  }

  parseArray(value) {
    value = value || [];
    value = value instanceof Array ? value : [];
    return value;
  }

  parseDevice(device) {
    return this.parseObject(device);
  }

  parseUser(user) {
    return this.parseObject(user);
  }

  /**
  * Adds a "type" field to conversation with a string version of the conversation enum
  *   See: https://developers.google.com/actions/reference/conversation
  */
  parseConversation(conversation) {
    conversation = this.parseObject(conversation);
    conversation.type = this.conversationTypes[conversation.conversation_type] || this.conversationTypes[0];
    return conversation;
  }

  /**
  * Creates query (object) key-value map to simplify intent argument data
  *   Contains `value`, `location` and `raw_text` parameters
  */
  parseAssistantQuery(args) {
    let query = args.reduce((query, arg) => {
      query[arg.name] = {
        value: arg.text_value ?
          (arg.text_value || '').replace(/ ' /gi, '\'') :
          (arg.raw_text || '').replace(/ ' /gi, '\''),
        location: arg.location_value,
        raw_text: (arg.raw_text || '').replace(/ ' /gi, '\'')
      };
      return query;
    }, {});
    query.trigger_query = query.trigger_query || {value: '', raw_text: ''};
    return query;
  }

  /**
  * Sanitizes inputs from Google Assistant, append `query` parameter (see above)
  */
  parseInput(input, defaultIntentName) {
    let i = this.parseObject(input);
    i.intent = i.intent || defaultIntentName;
    let sanitized = {
      intent: i.intent,
      raw_inputs: this.parseArray(i.raw_inputs)
        .map(rawInput => this.parseObject(rawInput)),
      arguments: this.parseArray(i.arguments)
        .map(argument => this.parseObject(argument)),
    };
    sanitized.query = this.parseAssistantQuery(sanitized.arguments);
    return sanitized;
  }

  parseInputs(inputs, defaultIntentName) {
    return this.parseArray(inputs).map(input => this.parseInput(input, defaultIntentName));
  }

}

module.exports = ActionParser;
