declare module "require-from-string" {
  function requireFromString(
    code: string,
    filename?: string,
    opts?: { appendPaths: string[]; prependPaths: string[] }
  ): any;
  namespace requireFromString {}
  export = requireFromString;
}
