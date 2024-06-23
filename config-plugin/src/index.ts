import babelGlobal, { NodePath, PluginOptions } from "@babel/core";
import { ImportDeclaration, isIdentifier } from "@babel/types";
const fs = require('fs')
const pathM = require('path')
const crypto = require('crypto');


function mtime(filePath: string) {
    try {
        return fs.statSync(filePath).mtimeMs
    } catch {
        return null
    }
}

function parseConfigJsonFile(filePath: string, verbose = false) {
    const content = fs.readFileSync(filePath)
    return JSON.parse(content)
}

export const getFilesHash = (filePaths: string[]) => {
    const getFileHash = (filePath: string) => {
        let hash = crypto.createHash('sha256');
        hash.update(fs.readFileSync(filePath));
        const cacheVersion = hash.digest('hex');
        return cacheVersion
    }
    return filePaths.map((filePath=>{
        return getFileHash(filePath)
    })).join("_")
}

export default (babel: typeof babelGlobal, options: PluginOptions) => {
    const t = babel.types

    const newOptions = {
        moduleName: '@ConfigPlugin',
        path: '.configPlugin.json',
        ...options
    }

    // @ts-expect-error
    babel.cache.using(() => mtime(newOptions.path))
    const jsonValue = parseConfigJsonFile(newOptions.path)
    // @ts-expect-error
    babel.addExternalDependency(pathM.resolve(newOptions.path))


    return {
        visitor: {
            ImportDeclaration: (nodePath: NodePath<ImportDeclaration>) => {
                if (nodePath.node.source.value === newOptions.moduleName) {
                    for (const [index, specifier] of nodePath.node.specifiers.entries()) {
                        if (specifier.type === 'ImportDefaultSpecifier') {
                            throw nodePath.get('specifiers')[index].buildCodeFrameError('Default import is not supported')
                        }

                        if (specifier.type === 'ImportNamespaceSpecifier') {
                            throw nodePath.get('specifiers')[index].buildCodeFrameError('Wildcard import is not supported')
                        }

                        if (specifier.imported && specifier.local) {
                            // @ts-expect-error
                            const importedId = specifier.imported.name
                            const localId = specifier.local.name
                            const binding = nodePath.scope.getBinding(localId)
                            if (binding?.referencePaths) {
                                for (const referencePath of binding.referencePaths) {
                                    referencePath.replaceWith(t.valueToNode(jsonValue[importedId]))
                                }
                            }

                        }
                    }

                    nodePath.remove()
                }
            }
        }
    }
}