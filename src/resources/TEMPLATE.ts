//
// Edit these functions to define search parameters. Type definitions are at the bottom of this file.
//

export function getSettings(): SearchOptions {
  return {
    // includeFilePatterns: [],              // globs to include, e.g. ['**/*.ts']. Searches all files by default.
    // excludeFilePatterns: [],              // globs to exclude.
    // includeNodeModules: false,            // (default: false) true if node_modules should be searched. Strongly discouraged.
    // maxFileSizeInKB: 1000,                // (default: 1000) any files larger than this will be skipped.
    // onlyTestLinesInMatchingFiles: false,  // (default: false) true if searchByLine should only be used on files that pass searchByFile
    // matchTestingTimeoutInSeconds: 5       // (default: 5) search is tested on a single file preliminarily. If your matchers takes longer than this, an error will appear.
  };
}

export function searchByLine(): LineSearchOptions {
  return {
    // A function that accepts a line of text and determines whether it matches your search.
    // If you only want to search by file, set this method to undefined.
    doesLineMatchSearch: (line: string, metadata: LineSearchMetadata) => {
      return line.includes("exactly what I'm looking for");
    },
  };
}

export function searchByFile(): FileSearchOptions {
  return {
    // A function that accepts a file (as a text string) and determines whether the file matches your search.
    // If you only want to search by line, set this method to undefined.
    doesFileMatchSearch: (file: string, metadata: FileSearchMetadata) => {
      return file.includes("another thing I'm looking for");
    },
  };
}

//
// Don't edit these interfaces; they're built into JSPS.
//

export interface SearchOptions {
  includeFilePatterns?: string[];
  excludeFilePatterns?: string[];
  includeNodeModules?: boolean;
  maxFileSizeInKB?: number;
  onlyTestLinesInMatchingFiles?: boolean;
  matchTestingTimeoutInSeconds?: number;
}

export interface LineSearchMetadata {
  fileName: string;
  filePath: string;
}

export interface LineSearchOptions {
  doesLineMatchSearch?: (line: string, metadata: LineSearchMetadata) => boolean;
}

export interface FileSearchMetadata {
  fileName: string;
  filePath: string;
  lines: string[]; // The file text as an array of lines
}

export interface FileSearchOptions {
  doesFileMatchSearch?: (
    fileContents: string,
    metadata: FileSearchMetadata
  ) => boolean;
}
