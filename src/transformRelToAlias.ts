import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import {
  createWrappedNode,
  printNode,
  Project,
  SourceFile,
  TypeGuards,
} from 'ts-morph';
import ts from 'typescript';
import { Logger } from './logger';

// tslint:disable-next-line no-var-requires

export interface ITsConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: {
      [key: string]: string[];
    };
  };
}

export interface IRelToAliasOptions {
  logger: Logger;
  configFileName: string;
  singleQuote: boolean;
  write: boolean;
}

export const transformRelToAlias = ({
  logger,
  configFileName,
  singleQuote,
  write,
}: IRelToAliasOptions): void => {
  const tsconfig = JSON.parse(
    readFileSync(configFileName, { encoding: 'utf8' })
  );
  const { baseUrl, paths } = tsconfig.compilerOptions;

  const basePath = resolve(dirname(configFileName), baseUrl);
  logger.debug(`configPath = ${configFileName}`);
  logger.debug(`basePath = ${basePath}`);
  logger.debug(`singleQuote = ${singleQuote}`);

  const pathToAliasMap = {} as Record<string, string>;
  Object.keys(paths).forEach((key: string): void => {
    const alias = key.replace(/\/\*$/, '');
    (paths as any)[key].forEach((p: string): void => {
      const path = resolve(basePath, p.replace(/\/\*$/, ''));
      pathToAliasMap[path] = alias;
      logger.debug(`${alias} -> ${path}`);
    });
  });

  const aliasPaths = Object.keys(pathToAliasMap) as string[];

  const project = new Project({
    tsConfigFilePath: configFileName,
  });

  const getChildStringLiteral = (source: SourceFile, node: ts.Node): string => {
    let from = '';
    node.forEachChild((c): void => {
      if (c.kind === ts.SyntaxKind.StringLiteral) {
        from = source.compilerNode.text.substring(c.pos, c.end);
      }
    });
    return from;
  };

  const stripQuotes = (s: string): string => s.trim().replace(/['"]/g, '');

  const relToAlias = (dir: string, rel: string): string | null => {
    const abs = resolve(dir, rel);
    for (let i = 0, len = aliasPaths.length; i < len; i += 1) {
      const p = aliasPaths[i];
      if (abs.startsWith(p)) {
        return abs.replace(p, pathToAliasMap[p]);
      }
    }
    return null;
  };

  const createStringLiteral = (s: string): ts.StringLiteral => {
    const node = ts.createStringLiteral(s);
    if (singleQuote) {
      (node as any).singleQuote = true;
    }
    return node;
  };

  let count = 0;

  project.getSourceFiles().forEach((file): void => {
    const dir = file.getDirectory();
    const dirPath = dir.getPath();

    let changed = false;
    file.transform(
      (traversal): ts.Node => {
        const { currentNode } = traversal;
        const node = createWrappedNode(currentNode);
        if (TypeGuards.isImportDeclaration(node)) {
          const { compilerNode } = node;
          const from = stripQuotes(getChildStringLiteral(file, compilerNode));
          if (from.startsWith('.')) {
            const aliased = relToAlias(dirPath, from);
            if (aliased) {
              const newNode = ts.updateImportDeclaration(
                compilerNode,
                compilerNode.decorators,
                compilerNode.modifiers,
                compilerNode.importClause,
                createStringLiteral(aliased)
              );

              count += 1;
              logger.log(
                `${count} ${file.getFilePath()}:
     ${printNode(compilerNode)}
  -> ${printNode(newNode)}`
              );
              changed = true;
              return newNode;
            }
          }
        } else if (TypeGuards.isExportDeclaration(node)) {
          const { compilerNode } = node;
          const from = stripQuotes(getChildStringLiteral(file, compilerNode));
          if (from.startsWith('.')) {
            const aliased = relToAlias(dirPath, from);
            if (aliased) {
              const newNode = ts.updateExportDeclaration(
                compilerNode,
                compilerNode.decorators,
                compilerNode.modifiers,
                compilerNode.exportClause,
                createStringLiteral(aliased),
                false
              );

              count += 1;
              logger.log(
                `${count} ${file.getFilePath()}:
     ${printNode(compilerNode)}
  -> ${printNode(newNode)}`
              );
              changed = true;
              return newNode;
            }
          }
        }

        return traversal.visitChildren();
      }
    );

    if (write && changed) {
      file.saveSync();
    }
  });
};
