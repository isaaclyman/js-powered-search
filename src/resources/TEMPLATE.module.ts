export const TEMPLATE = `

export interface SearchOptions {
  includeFilePatterns?: string[]; // globs to include, e.g. ['**/*.ts']. Searches all files by default.
  excludeFilePatterns?: string[]; // globs to exclude.
  includeNodeModules?: boolean; // (default: false) true if node_modules should be searched. Strongly discouraged.
  maxFileSizeInKB?: number; // (default: 1000) any files larger than this will be skipped.
  onlyTestLinesInMatchingFiles?: boolean; // (default: false) true if searchByLine should only be used on files that pass searchByFile
}

export function getSettings(): SearchOptions {
  return {
    // includeFilePatterns: [],
    // excludeFilePatterns: [],
    // includeNodeModules: false,
    // maxFileSizeInKB: 1000,
    // onlyTestLinesInMatchingFiles: false
  };
}

export interface LineSearchMetadata {
  fileName: string;
  filePath: string;
}

export interface LineSearchOptions {
  // A function that accepts a line of text and determines whether it matches your search.
  // If you only want to search by file, set this method to undefined.
  doesLineMatchSearch?: (line: string, metadata: LineSearchMetadata) => boolean;
}

export function searchByLine(): LineSearchOptions {
  return {
    doesLineMatchSearch: (line, metadata) => {
      return line.includes("exactly what I'm looking for");
    },
  };
}

export interface FileSearchMetadata {
  fileName: string;
  filePath: string;
  lines: string[]; // The file text as an array of lines
}

export interface FileSearchOptions {
  // A function that accepts a file (as a text string) and determines whether the file matches your search.
  // If you only want to search by line, set this method to undefined.
  doesFileMatchSearch?: (
    fileContents: string,
    metadata: FileSearchMetadata
  ) => boolean;
}

export function searchByFile(): FileSearchOptions {
  return {
    doesFileMatchSearch: (file, metadata) => {
      return file.includes("another thing I'm looking for");
    },
  };
}

`.trim();
