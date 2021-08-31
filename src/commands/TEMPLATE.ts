export const TEMPLATE = `

export function searchByLine(): LineSearchOptions {
  return {
    includeFilePatterns: ["*.ts"],
    doesLineMatchSearch: (line) => {
      return line.includes("exactly what I'm looking for");
    },
  };
}

export function searchByFile(): FileSearchOptions {
  return {
    includeFilePatterns: ["*.ts"],
    doesFileMatchSearch: (lines) => {
      return lines.some((line) =>
        line.startsWith("a start-of-line string I want to see")
      );
    },
  };
}

interface CommonSearchOptions {
  includeFilePatterns?: string[]; // default: includes all files
  excludeFilePatterns?: string[];
  includeNodeModules?: boolean; // default: false
}

interface LineSearchOptions extends CommonSearchOptions {
  doesLineMatchSearch: (line: string) => boolean;
}

interface FileSearchOptions extends CommonSearchOptions {
  doesFileMatchSearch: (fileContents: string[]) => boolean;
}

`.trim();
