import { writeFileSync } from 'fs';
import globby from 'globby';
import { basename, dirname, relative, resolve } from 'path';
import { capitalizeFirst, diff, uniqueItems } from 'ts-jutil';
import { ExportedDeclarations, Project } from 'ts-morph';
import { Logger } from './logger';

// tslint:disable-next-line no-var-requires

export interface IGenerateIndexOptions {
  logger: Logger;
  src?: string[];
  exclude?: string[];
  out: string;
  write: boolean;
  singleQuote: boolean;
}

const parentFileFirst = (a: string, b: string): number => {
  const aDir = dirname(a);
  const bDir = dirname(b);
  if (aDir === bDir) {
    if (basename(a).startsWith('index.')) {
      return -1;
    }
    if (basename(b).startsWith('index.')) {
      return 1;
    }
    return a.localeCompare(b);
  }
  return aDir.startsWith(bDir) ? 1 : -1;
};

const lastPathName = (path: string): string => {
  const i = path.lastIndexOf('/');
  return i === -1 ? path : path.substring(i + 1);
};

const getDefaultName = (abs: string): string => {
  const filename = basename(abs);
  let name: string;
  if (/^index\.(t|j)sx?$/.test(filename)) {
    name = lastPathName(dirname(abs));
  } else {
    name = filename.replace(/\.(t|j)sx?$/i, '');
  }
  return name;
};

const getNamePrefixFromFrom = (from: string, name: string): string => {
  const paths = from.replace(/['"\s]+/g, '').split('/');
  const nameL = name.toLowerCase();
  for (let i = paths.length - 1; i >= 0; i -= 1) {
    const path = paths[i];
    if (path.toLowerCase() !== nameL) {
      return `${path}${capitalizeFirst(name)}`;
    }
  }
  return name;
};

export const generateIndex = async ({
  logger,
  src,
  exclude,
  out,
  write,
  singleQuote,
}: IGenerateIndexOptions): Promise<void> => {
  const cwd = process.cwd();
  logger.debug('cwd=', cwd);

  const toAbs = (path: string): string => resolve(cwd, path);

  const outputFile = toAbs(out);
  const outDir = dirname(outputFile);
  logger.debug('output=', outputFile);

  let [includes, excludes] = await Promise.all([
    src && src.length ? globby(src) : globby(`${outDir}/**/*.{ts,tsx,js,jsx}`),
    exclude && exclude.length ? globby(exclude) : [],
  ]);

  includes = includes.map(toAbs);
  logger.debug('includes=', includes);

  excludes = excludes.map(toAbs);
  logger.debug('excludes=', excludes);

  const filepaths = diff(includes, excludes.concat(outputFile)).sort(
    parentFileFirst
  );

  logger.debug('files=', filepaths);

  const quote = singleQuote
    ? (s: string): string => `'${s}'`
    : (s: string): string => `"${s}"`;

  const decToNameToFroms = new Map<ExportedDeclarations, Map<string, string>>();

  const nameToDeclToFrom = new Map<string, Map<ExportedDeclarations, string>>();

  const fromToExportClauses = new Map<string, string[]>();

  const overloadedNames: { [key: string]: 1 } = {};

  const addExportClause = (exportClause: string, from: string): void => {
    const clauses = fromToExportClauses.get(from);
    if (clauses) {
      clauses.push(exportClause);
    } else {
      fromToExportClauses.set(from, [exportClause]);
    }
  };

  logger.debug('\n');

  const project = new Project();

  for (let fi = 0, flen = filepaths.length; fi < flen; fi += 1) {
    const filepath = filepaths[fi];

    const source = project.addExistingSourceFile(filepath);

    const exportDeclMap = source.getExportedDeclarations();
    if (exportDeclMap.size) {
      const path = relative(outDir, filepath);
      const from = quote(
        `./${path}`.replace(/\.(t|j)sx?$/, '').replace(/\/index$/, '')
      );

      for (const [exportName, decls] of Array.from(exportDeclMap.entries())) {
        const isDefaultExport = exportName === 'default';
        const betterExportName = isDefaultExport
          ? getDefaultName(filepath)
          : exportName;
        const exportClause = isDefaultExport
          ? `default as ${betterExportName}`
          : betterExportName;

        for (let di = 0, dlen = decls.length; di < dlen; di += 1) {
          const decl = decls[di];
          const declToFrom = nameToDeclToFrom.get(betterExportName);
          if (declToFrom) {
            // occupied name
            if (declToFrom.has(decl)) {
              // same name, same value => safe to ignore
              logger.debug(
                `// export { ${exportClause} } from ${from}; // duplicate from ${declToFrom.get(
                  decl
                )}`
              );
            } else {
              // same name, different value => bad overload
              const prevFroms = Array.from(declToFrom.values());
              if (prevFroms.includes(from)) {
                // type and value could be exported separately from same file
                logger.debug(
                  `export { ${exportClause} } from ${prevFroms
                    .concat(from)
                    .join(', ')}`
                );
              } else {
                if (prevFroms.some((x) => x !== from)) {
                  // overloaded
                  // different values exported to same name from different files
                  overloadedNames[betterExportName] = 1;
                  logger.warn(
                    `export { ${exportClause} } from ${prevFroms
                      .concat(from)
                      .join(', ')}`
                  );
                }
                declToFrom.set(decl, from);
                addExportClause(exportClause, from);
              }
            }
          } else {
            // new name
            nameToDeclToFrom.set(betterExportName, new Map([[decl, from]]));

            let nameToFroms = decToNameToFroms.get(decl);
            if (nameToFroms) {
              // different names, same value => already exported declaration
              logger.debug(
                `export { ${exportClause} } from ${from}; // also as ${Array.from(
                  nameToFroms.keys()
                ).join(', ')}`
              );
            } else {
              // different names, different value => fresh export
              logger.debug(`export { ${exportClause} } from ${from};`);
              nameToFroms = new Map<string, string>();
              decToNameToFroms.set(decl, nameToFroms);
            }

            nameToFroms.set(betterExportName, from);

            addExportClause(exportClause, from);
          }
        }
      }
    }
  }

  const exports: string[] = [];

  for (const [from, clauses] of Array.from(fromToExportClauses.entries())) {
    // same file can export both ts type and value under same export name
    // -> use unique filter
    const uniqClauses = uniqueItems(clauses).sort();
    exports.push(
      `export { ${uniqClauses
        .map((c) =>
          // prefix filename if overloaded
          overloadedNames[c] === 1
            ? `${c} as ${getNamePrefixFromFrom(from, c)}`
            : c
        )
        .join(', ')} } from ${from};`
    );
  }

  const text = exports.join('\n');
  if (write) {
    writeFileSync(outputFile, text);
  } else {
    logger.log(`
${text}
`);
  }
};
