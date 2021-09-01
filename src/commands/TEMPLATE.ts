export interface SearchOptions {
  includeFilePatterns?: string[]; // globs to include, e.g. ['*.ts']. Searches all files by default.
  excludeFilePatterns?: string[]; // globs to exclude.
  includeNodeModules?: boolean; // (default: false) true if node_modules should be searched. Strongly discouraged.
}

export function getSettings(): SearchOptions {
  return {
    // includeFilePatterns: [],
    // excludeFilePatterns: [],
    // includeNodeModules: false,
  };
}

export interface SearchMetadata {
  fileName: string;
  filePath: string;
  fileSizeInKB: string; // Useful for skipping extremely large files, if you need to speed up performance
}

export interface LineSearchOptions {
  // A function that accepts a line of text and determines whether it matches your search.
  // If you only want to search by file, set this method to undefined.
  doesLineMatchSearch?: (line: string, metadata: SearchMetadata) => boolean;
}

export function searchByLine(): LineSearchOptions {
  return {
    doesLineMatchSearch: (line) => {
      return line.includes("exactly what I'm looking for");
    },
  };
}

export interface FileSearchOptions {
  // A function that accepts a file (as an array of lines of text) and determines whether the file matches your search.
  // If you only want to search by line, set this method to undefined.
  doesFileMatchSearch?: (
    fileContents: string[],
    metadata: SearchMetadata
  ) => boolean;
}

export function searchByFile(): FileSearchOptions {
  return {
    doesFileMatchSearch: (lines) => {
      return lines.some((line) =>
        line.includes("another thing I'm looking for")
      );
    },
  };
}
