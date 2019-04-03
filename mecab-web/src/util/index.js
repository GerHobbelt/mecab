/**
 * @author CoolAJ86
 * https://stackoverflow.com/a/6969486/5257399
 */
export const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}