/** "Plomería" -> "plomeria" — lowercase, strip accents, spaces -> dashes. */
export function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accent marks
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}
