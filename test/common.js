import Ohbug from '../dist/ohbug.min';

const others = {
  id: Math.floor(Math.random() * 10),
};

function report(data) {
}

export const config = {
  delay: 2000,
  report,
  others,
  enabledDev: true,
  maxError: 10,
};

export const init = () => Ohbug.init(config);
