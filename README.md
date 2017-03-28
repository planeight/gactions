# Actions on Google

This is a helper for [Google Assistant Actions](https://developers.google.com/actions/)
development.

Its main goal is to simplify complexity around project organization and enable
a better development workflow. At present, with `gactions` you can:

1. Listen for intents based on a proprietary `action` Object and `handler`
2. Automatically load intents from a predefined directory structure
3. Compile `actionPackage`s from `action`s for easier deployment
4. Automatically format structured [Conversation Responses](https://developers.google.com/actions/reference/conversation)

## Installation

```bash
$ npm install gactions --save
```

## Setting Up Your Intents

With `gactions` you can add in intents inline (programmatically) or automatically
load them from a directory structure. For project organization, we suggest loading
from a directory, but either is fine.

### Inline Intent Handling

```javascript
const Action = require('gactions').Action;
const myAction = new Action('my assistant'); // any name works

// Sets up MAIN intent
myAction.addIntent(
  'MAIN',
  {
    description: 'None'
  },
  (user, device, conversation, query, callback) => {

    // first parameter is error, second is text to speech
    callback(null, 'Hey, welcome to your Assistant Action!');

  }
});

/*
  Sets up TEXT intent (name can be anything you'd like, though)
  See https://developers.google.com/actions/reference/action-package#query_patterns
    for "queries" details

  Will be triggered on "my name is Steven" / etc.
*/
myAction.addIntent(
  'TEXT',
  {
    description: 'None',
    queries: [
      'My name is $SchemaOrg_Text:name'
    ]
  },
  (user, device, conversation, query, callback) => {

    /*
      NOTE: Now query is object with `query.name.value` being set

      Third parameter is an array of "prompts" --- if this is non-empty,
        Google Assistant will expect further input from the user
      Final parameter is what intents (in shorthand, like "MAIN") Google
        Assistant should respond with
    */
    callback(
      null,
      `Hey, nice to meet you ${query.name.value}! Can I get you a coffee?`,
      ['Are you still there?'],
      ['MAIN']
    );

  }
});
```

### Directory-Based Intent Handling

First, set up a directory structure like:

```
\- action
   \- intents
      \- main
          - action.json
          - handler.js
      \- text
          - action.json
          - handler.js
```

Where `action.json` is a JSON object corresponding to the `action`s expected
in the inline intent handling, and `handler.js` exports a function in the format:

```javascript
module.exports = (user, device, conversation, query, callback) => {}
```

You can then load all your intents at once using:

```javascript
const Action = require('gactions').Action;
const myAction = new Action('my assistant'); // any name works

myAction.loadIntents('./action/intents');
```

## Responding to HTTP Requests

Responding to HTTP requests is simple --- but this library is non-opinionated
as to how the HTTP request is sent in and processed. A full implementation may
look like this:

```javascript
const Action = require('gactions').Action;
const myAction = new Action('my assistant'); // any name works

myAction.loadIntents('./action/intents');

// Fictional HTTP Handler. Receives a JS object "body" from JSON
module.exports = function HTTPHandler(body, callback) {

  myAction.runIntent(body, (err, result, headers) => {

    // Will populate a result Object and necessary HTTP headers to be
    //   sent to the client - can just callback or can handle however we like :)
    callback(err, result, headers);

  });

}
```

## Acknowledgements

Special thanks to Google for doing an awesome job with Assistant! Hope you
all enjoy playing as much as we have. :)
