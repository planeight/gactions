# Actions on Google

This is a helper for [Google Assistant Actions](https://developers.google.com/actions/)
development.

Its main goal is to simplify complexity around project organization and enable
a better development workflow. At present, with `gactions` you can:

1. Listen for intents based on a proprietary `action` Object and `handler`
  - `action` expects only a `"description"` field and `"queries"` array of strings that map to
  [query patterns](https://developers.google.com/actions/reference/action-package#query_patterns))
  - `handler` follows a simplified form of (user, device, conversation, query, callback)
2. Automatically load intents from a predefined directory structure
  - (`/intents/{name}/action.json` and `/intents/{name}/handler.js`)
3. Compile `actionPackage`s from `action`s for easier deployment
4. Automatically format structured [Conversation Responses](https://developers.google.com/actions/reference/conversation)

More coming soon!
