const logger = {
  log(...args) {
    console.log(...args);
  }
};

export const logOptions = {
  filter: 'fail',
  format: '%(date)s %(description)s',
  levels: {
    fail: {
      icon: '\x1b[31m✖\x1b[0m',
      logger
    },
    info: {
      icon: ' ',
      logger
    },
    pass: {
      icon: '\x1b[32m✔\x1b[0m',
      logger
    },
    skip: {
      icon: ' ',
      logger
    }
  }
};

export function log(worker, name, box, data, callback, ...extra) {
  const filter = logOptions.filter === 'all' ?
    'pass,fail,skip,info' : logOptions.filter;

  if (filter.indexOf(name) === -1) {
    if (worker.getLog() !== true) {
      return;
    }
  }

  let error = '';

  if (name === 'fail') {
    const unlogged = data instanceof Error === true &&
      data.logged !== true;
    const onlyFail = filter.indexOf(',') === -1;

    if (unlogged) {
      error = data;
      error.logged = true;
      data = '';
    } else if (onlyFail) {
      return;
    }

    if (error && error.data && error.data.password) {
      delete error.data.password;
    }
  }

  const level = logOptions.levels[name];

  const description = worker.resolve(
    box,
    data || error,
    worker.getDescription(),
    ...extra
  );

  const options = {
    date: new Date().toISOString(),
    description: description || worker.constructor.name,
    icon: level.icon,
    id: worker.getId(),
    name: worker.constructor.name,
    box,
    data,
    error,
    callback
  };

  const format = worker.resolve(
    box,
    data,
    logOptions.format,
    options,
    ...extra
  );

  if (format === null) {
    return;
  }

  try {
    level.logger.log(worker.stringify(format, options), error);
  } catch (writeError) {
    console.log('Could not write to log', writeError);
  }
}
