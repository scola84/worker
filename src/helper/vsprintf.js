import * as formatters from './vsprintf/';

const regexpBase = '%((\\((\\w+)\\))?((\\d+)\\$)?)([lmns])(\\[(.+)\\])?';
const regexpGlobal = new RegExp(regexpBase, 'g');
const regexpSingle = new RegExp(regexpBase);
const reductor = (name) => (a, v) => v[name];

export function vsprintf(format, args, locale) {
  const matches = format.match(regexpGlobal) || [];

  let match = null;
  let name = null;
  let position = null;
  let options = null;
  let type = null;
  let value = null;

  for (let i = 0; i < matches.length; i += 1) {
    [
      match, , , name, , position, type, , options
    ] = matches[i].match(regexpSingle);

    if (position) {
      value = args[position - 1];
    } else if (name) {
      value = args.reduce(reductor(name), '');
    } else {
      value = args[i];
    }

    if (typeof value === 'undefined' || value === null) {
      value = '';
    } else if (formatters[type]) {
      value = formatters[type](value, options, locale);
    }

    format = format.replace(match, value);
  }

  return format;
}

Object.assign(vsprintf, formatters);
