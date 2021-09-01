# JS Powered Search

Suppose you're working in a large codebase and for personal reasons you need to find every file with a `.ts` extension that imports `urlUtilityClass`, uses the `urlJoin` method of that class two or more times, uses the `protocolReplace` method of that class _exactly three times_, and _never_ uses the `validateUrl` method of that class. (It's okay, we're all working with legacy code here.) Feel a RegEx headache coming on?

JS Powered Search (JSPS) is a simple engine for searching a project using the full power of JavaScript. It's more powerful than RegEx and _way_ more powerful than a text search, although it has the ability to do both. Any conditional logic you can do with code, you can also do with JSPS -- search depth, complexity, and performance are all up to you.

JSPS scaffolds a self-contained search definition file which you can alter to your needs by writing code to determine whether each file or line of code matches your search. You can save useful search files to your computer, making it easy to run them from the Command Palette later. If you commit your search files to version control, the whole team can use them just as easily.

Contribute here: https://github.com/isaaclyman/js-powered-search

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

<!-- ## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: enable/disable this extension
- `myExtension.thing`: set to `blah` to do something -->

## Known Issues

Extension is in preview.

## Release Notes

### 0.0.1

Initial release.

## Wishlist

- Allow passing in a fake "test file" or "test line" to the appropriate functions. The contents should pass the test defined by the predicate. Otherwise, you'll receive an error message. This will give a quick understanding of what the test is looking for.
- Allow imports in search definition file. (This is untested, probably doesn't work, and may not be possible.)
