# Change Log

All notable changes to the "jsPoweredSearch" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2021-09-01

- Initial release.

## [0.0.2] - 2021-09-01

- Fixed extension crash on load.

## [0.0.3] - 2021-09-02

- When searching without a file or line matcher, return all files that match the patterns.
- When a search is complete, report how long it took in the Results pane.

## [0.0.4] - 2021-09-04

- Added unit tests for scaffolding, searching, and showing results.
- Created a preliminary testing feature to ensure matchers work on one file before running them in parallel on all files.
- Added a `matchTestingTimeoutInSeconds` feature to the search settings. If the preliminary test takes longer than this, the user will see an error.
- If the preliminary test fails for whatever reason, the user may still choose to continue the search.

## [0.0.5] - 2021-09-04

- Fixed broken repo link in README.

## [0.0.6] - 2021-09-10

- Added the "Export JSON" command, which exports all current search results to a JSON document in a new text editor window.

## [1.0.0] - 2021-09-22

- Improve the seach template's usability and readability. Take JSPS out of preview.

## [1.0.1] - 2021-09-22

- Improve the README.

## [1.1.0] - 2024-06-15

Upgrade packages and extension tooling; add `onlyShowFilesWithMatchingLines` option to search settings.

## [1.1.1] - 2024-06-16

Update README with new Ko-fi sponsorship link.

## [1.1.2] - 2024-06-16

License extension under CC-BY-SA 4.0.