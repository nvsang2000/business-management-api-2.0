import slugify from 'slugify';
import * as fs from 'fs-extra';
import { LINK_PROFILE, REG_IS_STATE } from './constants';

export const parseSafe = (s) => {
  try {
    return JSON.parse(s);
  } catch (_) {
    return undefined;
  }
};

export const sumNumberArray = (array: Array<any>) => {
  return array.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
};

export const setDelay = (ms: any) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const generateSlug = (text: string): string => {
  const splitText = text.replace(/['&]/g, '');
  return slugify(splitText, {
    lower: true,
  });
};

export const transformTextSearch = (str: any) =>
  str
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
    .trim()
    .split(' ')
    .join(' & ');

export const getFiles = (dataDir: string): string[] => {
  try {
    const files = fs.readdirSync(dataDir);
    console.log('files', files);
    return files;
  } catch (err) {
    console.error('Error reading userDataDir:', err);
    return [];
  }
};

export const formatPhoneNumber = (phone: string) => {
  return phone?.replace(/\D/g, '')?.slice(-10);
};

export const parseUSAddress = (
  addressLocality: string,
  addressStreet: string,
) => {
  let zipCode: string, state: string, city: string;
  if (addressLocality) {
    const addressParts = addressLocality.trim().split(',');
    const stateAndZip = addressParts[1]?.trim()?.split(' ') ?? [null, null];

    city = addressParts[0];
    state = stateAndZip[0];
    zipCode = stateAndZip[1];
  } else if (addressStreet) {
    const addressParts = addressLocality.split(',');
    if (addressParts.length > 1) {
      const lastParts = addressParts[addressParts.length - 1];
      const stateAndZip = lastParts.trim().split(' ');
      if (stateAndZip.length == 2 && stateAndZip[1].match(REG_IS_STATE)) {
        state = stateAndZip[0];
        zipCode = stateAndZip[1];
        if (addressParts.length > 2) {
          city = addressParts[addressParts.length - 2];
          addressStreet = addressStreet
            .slice(0, addressStreet.length - lastParts.length - city.length)
            .trim();
          city = city.trim();
        } else
          addressStreet = addressStreet.slice(
            0,
            addressStreet.length - lastParts.length,
          );
      } else city = lastParts;
    }
  }

  return { state, zipCode, city, address: addressStreet };
};

export const parseWebsite = (links: string[]) => {
  return links.map((link: string) => {
    let type = null;
    for (const key in LINK_PROFILE) {
      if (link.startsWith(LINK_PROFILE[key])) {
        type = key;
        break;
      }
    }
    return { link, type };
  });
};

export const removeDuplicates = (arr: any[]) => {
  const uniqueArr = [];

  arr.forEach((item) => {
    if (!uniqueArr.includes(item)) {
      uniqueArr.push(item);
    }
  });

  return uniqueArr;
};

export const promisesSequentially = async (promises: any[], limit: number) => {
  const results = [];
  const executing = [];
  for (const promise of promises) {
    const p = Promise.resolve().then(() => promise());
    results.push(p);
    if (executing.length >= limit) await Promise.race(executing);
    executing.push(p.then(() => executing.splice(executing.indexOf(p), 1)));
  }
  return Promise.all(results);
};

export const convertDurationToTime = (duration: number): string => {
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  const totalProcessTime = `${days} day ${hours} hour ${minutes} minute`;
  return totalProcessTime;
};
