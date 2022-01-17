/**
 * Stack router configuration object.
 *
 * @member splitBlock - Separator of route blocks.
 *         It must be a length 1 string containing one of the following non URI escapable characters: `-_.!~*'()`.
 *         Default: `~`
 * @member splitParam - Separator of context properties keys and values.
 *         It must be a length 1 string containing any character except for the reserved characters: `;/?:@&+$#`.
 *         Note that `=` is a reserved character, but it is supported.
 *         Default: `=`
 */
export type Configuration = {
    splitBlock: '-' | '_' | "'" | '.' | '!' | '~' | '*'
    splitParam: string
}

/**
 * Default configuration options.
 * @see Configuration
 */
export const defaultConfiguration: Configuration = Object.freeze({
    splitBlock: '~',
    splitParam: '=',
})

/**
 * Fill in the received partial `configuration` object with the `defaultConfiguration` values and check invalid values.
 *
 * @param configuration - The configuration object.
 * @returns The configuration object with the default values.
 * @throws If the configuration object contains invalid values.
 * @see Configuration
 */
export const loadConfiguration = (configuration: Partial<Configuration>): Readonly<Configuration> => {
    const final = Object.freeze({ ...defaultConfiguration, ...configuration })
    if (!['-', '_', "'", '.', '!', '~', '*'].includes(final.splitBlock))
        throw new Error(`Invalid splitBlock, must be one of -_.!~*'(). Got: "${final.splitBlock}".`)
    if (final.splitParam.length !== 1 || [';', '/', '?', ':', '@', '&', '+', '$', '#'].includes(final.splitParam))
        throw new Error(`Invalid splitParam, must be 1 length string except for ;/?:@&+$#. Got: "${final.splitParam}".`)
    return final
}
