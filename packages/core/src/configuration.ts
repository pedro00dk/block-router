/**
 * Stack router configuration object.
 *
 * @member blockSeparator - Separator of route blocks.
 *         It must be a length 1 string containing one of the following non URI escapable characters: `-_.!~*'()`.
 *         Default: `~`
 * @member paramSeparator - Separator of context properties keys and values.
 *         It must be a length 1 string containing any character except for the reserved characters: `;/?:@&+$#`.
 *         Note that `=` is a reserved character, but it is supported.
 *         Default: `=`
 */
export type Configuration = {
    blockSeparator: '-' | '_' | "'" | '.' | '!' | '~' | '*'
    paramSeparator: string
}

/**
 * Default configuration options.
 * @see Configuration
 */
export const defaultConfiguration: Configuration = Object.freeze({
    blockSeparator: '~',
    paramSeparator: '=',
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
    if (final.paramSeparator.length !== 1)
        throw new Error(`Invalid blockSeparator, must 1 length string. Got: "${final.blockSeparator}".`)
    if (!['-', '_', "'", '.', '!', '~', '*'].includes(final.blockSeparator))
        throw new Error(`Invalid blockSeparator, must be one of -_.!~*'(). Got: "${final.blockSeparator}".`)
    if (final.paramSeparator.length !== 1)
        throw new Error(`Invalid paramSeparator, must 1 length string. Got: "${final.paramSeparator}".`)
    if ([';', '/', '?', ':', '@', '&', '+', '$', '#'].includes(final.paramSeparator))
        throw new Error(`Invalid paramSeparator, must not contain any of ;/?:@&+$#. Got: "${final.paramSeparator}".`)
    return final
}
