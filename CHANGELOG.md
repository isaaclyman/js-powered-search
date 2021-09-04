# Change Log

All notable changes to the "jsPoweredSearch" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Some README changes

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