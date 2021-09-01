# JS Powered Search

Suppose you're working in a large codebase and for personal reasons you need to find every file with a `.cs` extension that imports `urlUtilityClass`, uses the `urlJoin` method of that class two or more times, uses the `protocolReplace` method of that class _exactly three times_, and _never_ uses the `validateUrl` method of that class. (It's okay, we're all working with legacy code here.) Feel a RegEx headache coming on?

JS Powered Search (JSPS) is a simple engine for searching a project using the full power of JavaScript. It's more powerful than RegEx and _way_ more powerful than a text search, although it has the ability to do both. Any stateful logic you can write with code, you can use in JSPS -- search depth, complexity, and performance are all up to you.

JSPS scaffolds a self-contained search definition file which you can alter by writing code to determine whether each file or line of code matches your search. You can save useful search definitions to your computer, making it easy to run them from the Command Palette or the JSPS Results pane later. If you commit your search definitions to version control, the whole team can use them just as easily.

Contribute here: https://github.com/isaaclyman/jsPoweredSearch

Buy me a Coke: https://paypal.me/isaaclyman

## Features

Scaffold a powerful Search Definition file instantly:

![Scaffold search definition](media/demo-scaffold.gif)

## How to begin

Open the Command Palette with Ctrl + Shift + P. JS Powered Search provides two commands:

### Scaffold

This creates a search definition file. JSPS will ask if you want to use a new unsaved editor window, create a new file at the project root, or overwrite the currently active file. Whatever you choose, you'll get a TypeScript file with three exported functions: one that returns general settings for your search, one that returns line matching functionality, and one that returns file matching functionality. TypeScript interfaces for every type you'll be interacting with are fully defined in the file.

From here, defining your search parameters is up to you. You can use multiple globs to include and exclude files by directory, filename, and extension. You can opt out of line matching, file matching, or both. You can write as much or as little logic in each matcher as you want, maintaining state with the provided closures (but keep in mind that files are not searched sequentially or in any particular order).

### Search

This executes a full workspace search using the currently active file as a search definition. JSPS will let you know if there's something wrong with your file, and the operation can be cancelled at any point. The JSPS Results pane will open to show results as they come in. Click any search result to jump to it in your codebase, or click the X icon to dismiss it.

## Known Issues

Extension is in preview.

## Release Notes

### 0.0.1

Initial release.

## Wishlist

- Allow passing in a fake "test file" or "test line" to the appropriate functions. The contents should pass the test defined by the predicate. Otherwise, you'll receive an error message. This will give a quick understanding of what the test is looking for.
- Allow imports in search definition file. (This is untested, probably doesn't work, and may not be possible.)
