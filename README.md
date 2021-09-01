# JS Powered Search

Suppose you're working in a large codebase and for personal reasons you need to find every file with a `.ts` extension that imports `urlUtilityClass`, uses the `urlJoin` method of that class two or more times, uses the `protocolReplace` method of that class _exactly three times_, and _never_ uses the `validateUrl` method of that class. (It's okay, we're all working with legacy code here.) Feel a RegEx headache coming on?

JS Powered Search (JSPS) is a simple engine for searching a project using the full power of JavaScript. It's more powerful than RegEx and _way_ more powerful than a text search, although it has the ability to do both. Any stateful logic you can write with code, you can use in JSPS -- search depth, complexity, and performance are all up to you.

JSPS scaffolds a self-contained search definition file which you can alter to your needs by writing code to determine whether each file or line of code matches your search. You can save useful search definitions to your computer, making it easy to run them from the Command Palette later. If you commit your search definitions to version control, the whole team can use them just as easily.

Contribute here: https://github.com/isaaclyman/jsPoweredSearch

Buy me a Coke: https://paypal.me/isaaclyman

## How to begin

Open the Command Palette with Ctrl + Shift + P. JS Powered Search provides two commands:

### Scaffold

This creates a search definition file. JSPS will ask if you want to use a new unsaved editor window, create a new file at the project root, or overwrite the currently active file. Whatever you choose, you'll get a TypeScript file with three exported functions: one that returns general settings for your search, one that returns line matching functionality, and one that returns file matching functionality. TypeScript interfaces for every type you'll be interacting with are fully defined in the file.

From here, defining your search parameters is up to you. You can use multiple globs to include and exclude files by directory, filename, and extension. You can opt out of line matching, file matching, or both. You can write as much or as little logic in each matcher as you want, maintaining state with the provided closures (but keep in mind that files are not searched sequentially or in any particular order).

### Search

This executes a workspace-wide search using the currently active file as a search definition. JSPS will let you know if there's something wrong with your file, and the operation can be cancelled at any point. The JSPS Search Results pane will open to show results as they come in. Click any search result to jump to it in your codebase.

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
