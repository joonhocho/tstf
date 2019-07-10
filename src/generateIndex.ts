import { writeFileSync } from 'fs';
import globby from 'globby';
import { basename, dirname, relative, resolve } from 'path';
import { diff, uniqueItems } from 'ts-jutil/dist/node/array';
import { ExportedDeclarations, Project } from 'ts-morph';
import { Logger } from './logger';

// tslint:disable-next-line no-var-requires

export interface IGenerateIndexOptions {
  logger: Logger;
  singleQuote: boolean;
  exclude?: string;
  filePaths: string[];
  outputFile: string;
  write: boolean;
}

const compareFiles = (a: string, b: string): number => {
  const aDir = dirname(a);
  const bDir = dirname(b);
  if (aDir === bDir) {
    return a.localeCompare(b);
  }
  return aDir.startsWith(bDir) ? 1 : -1;
};

const getDefaultName = (abs: string): string => {
  const filename = basename(abs);
  let name: string;
  if (/^index\.(t|j)sx?$/.test(filename)) {
    const paths = dirname(abs).split('/');
    name = paths[paths.length - 1];
  } else {
    name = filename.replace(/\.(t|j)sx?$/i, '');
  }
  return name;
};

export const generateIndex = ({
  logger,
  singleQuote,
  exclude,
  filePaths,
  outputFile,
  write,
}: IGenerateIndexOptions): void => {
  const cwd = process.cwd();
  logger.debug('cwd=', cwd);

  const out = resolve(cwd, outputFile);
  const outDir = dirname(out);
  logger.debug('output=', out);

  const includes = uniqueItems(
    filePaths.reduce<string[]>((all, path) => all.concat(globby.sync(path)), [])
  );
  logger.debug('includes=', includes);

  const excludes = exclude ? globby.sync(exclude) : [];
  logger.debug('excludes=', excludes);

  const files = diff(includes, excludes).sort(compareFiles);

  logger.debug('files=', files);

  const quote = singleQuote
    ? (s: string): string => `'${s}'`
    : (s: string): string => `"${s}"`;

  const decToNameToFroms = new Map<ExportedDeclarations, Map<string, string>>();

  const nameToDeclToFrom = new Map<string, Map<ExportedDeclarations, string>>();

  const fromToExports = new Map<string, string[]>();

  const addExport = (exportName: string, from: string): void => {
    const exportNames = fromToExports.get(from);
    if (exportNames) {
      exportNames.push(exportName);
    } else {
      fromToExports.set(from, [exportName]);
    }
  };

  logger.debug('\n');

  const project = new Project();

  files.forEach((filePath) => {
    const abs = resolve(cwd, filePath);

    const source = project.addExistingSourceFile(abs);

    const expDecs = source.getExportedDeclarations();
    if (expDecs.size) {
      const path = relative(outDir, abs);
      const from = quote(`./${path}`.replace(/\/index(\.(t|j)sx?$)?$/, ''));

      expDecs.forEach((decls, n) => {
        const isDefault = n === 'default';
        const name = isDefault ? getDefaultName(abs) : n;
        const exportName = isDefault ? `default as ${name}` : name;

        decls.forEach((decl) => {
          const declToFrom = nameToDeclToFrom.get(name);
          if (declToFrom) {
            // occupied name
            if (declToFrom.has(decl)) {
              // same value => safe to ignore
              logger.debug(
                `// export { ${exportName} } from ${from}; // duplicate from ${declToFrom.get(
                  decl
                )}`
              );
            } else {
              // different value => bad overload
              declToFrom.set(decl, from);
              logger.warn(
                `export { ${exportName} } from ${Array.from(
                  declToFrom.values()
                ).join(', ')}`
              );
              addExport(exportName, from);
            }
          } else {
            // empty name
            nameToDeclToFrom.set(name, new Map([[decl, from]]));

            let nameToFroms = decToNameToFroms.get(decl);
            if (nameToFroms) {
              // already exported declaration
              logger.debug(
                `export { ${exportName} } from ${from}; // also as ${Array.from(
                  nameToFroms.keys()
                ).join(', ')}`
              );
            } else {
              // fresh export
              logger.debug(`export { ${exportName} } from ${from};`);
              nameToFroms = new Map<string, string>();
              decToNameToFroms.set(decl, nameToFroms);
            }

            nameToFroms.set(name, from);

            addExport(exportName, from);
          }
        });
      });
    }
  });

  const exports: string[] = [];

  fromToExports.forEach((names, from) => {
    exports.push(`export { ${names.sort().join(', ')} } from ${from};`);
  });

  const text = exports.join('\n');
  if (write) {
    writeFileSync(outputFile, text);
  } else {
    logger.log(`
${text}
`);
  }
};
