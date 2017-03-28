const fs = require('fs');
const path = require('path');

const ActionResponse = require('./action_response.js');
const ActionParser = require('./action_parser.js');
const ActionTest = require('./action_test.js');

/**
* This is the basic Request / Response handler (and router) for Google Action
*   Endpoints. It is used to handle requests based on JSON body content,
*   can mock (test) requests, and it can generate Action Packages based on
*   provided intents.
*
*   For Conversation API reference, please visit:
*     https://developers.google.com/actions/reference/conversation
* @class
*/
class Action {

  /**
  * Instantiates Action with a body data parser
  * @param {String} name The name of your assistant, for displaying test output
  * @return {Action}
  */
  constructor(name) {
    this._name = name || 'my assistant';
    this._intents = {};
    this._intentPrefix = 'assistant.intent.action.';
    this._mainIntent = 'MAIN';
    this.parser = new ActionParser();
  }

  /**
  * Returns a default intent name (typically assistant.intent.action.MAIN)
  * @return {String}
  */
  defaultIntentName() {
    return this._intentPrefix + this._mainIntent;
  }

  /**
  * Format intent name from a shortName (i.e. "main") to enforce case insensitivity
  * @param {String} shortName Shorthand intent name (i.e. "main")
  * @return {String}
  */
  formatIntentName(shortName) {
    return this._intentPrefix + (shortName || this._mainIntent).toUpperCase();
  }

  /**
  * Listens for actions / intents based on a shorthand name, an `action` Object and
  *   a callback `handler`
  *
  *     - `action` MUST contain a "description" field
  *     - `action` MUST contain a "queries" field as an array
  *     - `handler` MUST export be valid function with arguments:
  *       (user, device, conversation, query, callback)
  *
  * @param {String} shortName Shorthand intent name (i.e. "main")
  * @param {Object} action Shorthand details for actionPackage data (see above)
  * @param {Function} handler Callback to execute for intent fulfillment (see above)
  * @return {Action}
  */
  addIntent(shortName, action, handler) {
    let name = this.formatIntentName(shortName);
    this._intents[name] = {
      action: action,
      handler: handler
    };
    return this;
  }

  /**
  * Listens for actions from a provided directory path. Each subdirectory name
  *   is used as the shorthand name for the action (i.e. /main becomes
  *   assistant.intent.action.MAIN). All names are uppercased by default to
  *   enforce case insensitivity.
  *
  *   Each subdirectory MUST contain an `action.json` and `index.js` file.
  *     - `action.json` MUST contain a "description" field
  *     - `action.json` MUST contain a "queries" field as an array
  *     - `handler.js` MUST export valid function with arguments:
  *       (user, device, conversation, query, callback)
  * @param {String} pathname the directory in which to load actions
  * @return {Action}
  */
  loadIntents(pathname) {
    pathname = path.join(process.cwd(), pathname || '');
    fs.readdirSync(pathname)
      .filter(name => fs.statSync(path.join(pathname, name)).isDirectory())
      .forEach(name => {
        let actionPath = path.join(pathname, name, 'action.json');
        let handlerPath = path.join(pathname, name, 'handler.js');
        let action, handler;
        if (!fs.existsSync(actionPath)) {
          throw new Error(`Can not load intent ${name}: No "action.json" found.`);
        }
        if (!fs.existsSync(handlerPath)) {
          throw new Error(`Can not load intent ${name}: No "handler.js" found.`);
        }
        try {
          action = require(actionPath);
        } catch (e) {
          console.error(e);
          throw new Error(`Could not load intent ${name}: Invalid JSON exported from "action.json"`);
        }
        try {
          handler = require(handlerPath);
        } catch (e) {
          console.error(e);
          throw new Error(`Could not load intent ${name}: Invalid function exported from "handler.js"`);
        }
        this.addIntent(name, action, handler);
      });
    return this;
  }

  /**
  * Retrieves an intent you've loaded or are listening to based on the full
  *   intentName (includes a prefix of `assistant.intent.action`)
  * @param {String} intentName The full name of the intent
  * @param {Function} callback Handler with form (err, result)
  * @return {undefined}
  */
  findIntent(intentName, callback) {
    if (intentName.substr(0, this._intentPrefix.length) !== this._intentPrefix) {
      return callback(new Error(`Invalid intent "${intentName}", must start with "${this._intentPrefix}"`));
    }
    let intent = this._intents[intentName];
    if (!intent) {
      return callback(new Error(`Intent not found: ${intentName}`));
    }
    return callback(null, intent);
  }

  /**
  * Executes an intent based upon a shortname and "query" variables (match to queryPatterns)
  * @param {String} shortName Shorthand for the intent name (i.e. "main")
  * @param {Object} query Key-value pairs for Assistant argument (SchemaOrg variables)
  * @param {Function} callback Handler with form (err, result)
  * @return {undefined}
  */
  testIntent(shortName, query, callback) {
    return this.runIntent(
      new ActionTest(this._name, this.formatIntentName(shortName), query).toObject(),
      callback
    );
  }

  /**
  * Executes an intent based upon HTTP POST body data
  * @param {Object} body HTTP POST body data from JSON object
  * @param {Function} callback Handler with form (err, result)
  * @return {undefined}
  */
  runIntent(body, callback) {

    body = this.parser.parseObject(body);
    let headers = {'Google-Assistant-API-Version': 'v1'}

    let user = this.parser.parseUser(body.user);
    let device = this.parser.parseDevice(body.device);
    let conversation = this.parser.parseConversation(body.conversation);
    let inputs = this.parser.parseInputs(body.inputs, this.defaultIntentName());
    let topInput = inputs[0] || this.parser.parseInput({}, this.defaultIntentName());

    let intentName = topInput.intent;
    let query = topInput.query;

    this.findIntent(intentName, (err, intent) => {

      if (err) {
        return callback(
          null,
          new ActionResponse(err).toObject(),
          headers
        );
      }

      intent.handler(
        user,
        device,
        conversation,
        query,
        (err, message, prompts, intents, state) => {
          intents = (intents || []).map(shortName => this.formatIntentName(shortName));
          let actionResponse = new ActionResponse(err, message, prompts, intents);
          callback(
            null,
            actionResponse.toObject(state),
            headers
          );
        }
      );

    });

  }

  /**
  * Procedurally generates an Action Package from provided intents
  *   See: https://developers.google.com/actions/reference/action-package
  *   for more details.
  *
  *   NOTE: "queries" field in `action` object get converted into queryPatterns automatically
  *
  * @param {String} projectId
  * @param {String} versionLabel
  * @param {String} invocationName
  * @param {String} voiceName
  * @param {String} languageCode
  * @param {String} endpoint
  * @return {Object} actionPackage
  */
  generateActionPackage(projectId, versionLabel, invocationName, voiceName, languageCode, endpoint) {

    let actions = Object.keys(this._intents).reduce((actions, intentName) => {

      let intent = this._intents[intentName] || {};
      let action = intent.action || {};

      actions.push({
        description: action.description,
        initialTrigger: {
          intent: intentName,
          queryPatterns: action.queries && action.queries.map(q => { return {queryPattern: q}; })
        },
        httpExecution: {
          url: endpoint
        }
      });

      return actions;

    }, []);

    return {
      versionLabel: versionLabel,
      agentInfo: {
        languageCode: languageCode,
        projectId: projectId,
        invocationNames: [invocationName],
        voiceName: voiceName
      },
      actions: actions
    };

  }

}

module.exports = Action;
