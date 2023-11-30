import slugify from 'slugify';
import * as fs from 'fs-extra';
import {
  DEFAULT_OPTION_HEADER_FETCH,
  METHOD,
  REG_IS_STATE,
  REG_IS_STRESS,
} from './constants';

export const parseSafe = (s) => {
  try {
    return JSON.parse(s);
  } catch (_) {
    return undefined;
  }
};

export const getNestedVal = (object, path) =>
  path.split('.').reduce((res, prop) => res?.[prop], object);

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

export const coverPhoneNumber = (phoneNumber: any) => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    const formatted = `(${match[1]}) ${match[2]}-${match[3]}`;
    return formatted;
  }
  return phoneNumber;
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
  let currentIndex = 0; // Index of the fulfilled promise

  // Function executes the next promise in the sequence
  async function executeNext() {
    const index = currentIndex; // Save the current index to ensure the correct promise is made
    currentIndex++; // Increase the index to prepare for the next promise

    if (index >= promises.length) return; // If the index exceeds the number of promises, end

    const result = await promises[index](); // Wait for the promise to complete
    results[index] = result; // Add the result at the correct index
    await executeNext(); // Callback the rule to execute the next promise
  }

  // Create a promise for each execution and add it to the executingPromises array
  const executingPromises = [];
  for (let i = 0; i < limit; i++) {
    executingPromises.push(executeNext());
  }

  // Wait for all promises in executingPromises to complete
  await Promise.all(executingPromises);
  return results;
};

export const parseAddress = (address: string) => {
  const parts = address?.split(',').map((part) => part.trim());

  const country = parts?.[3] ? parts?.pop() : undefined;
  const zipCodeAndState = parts?.[2] ? parts?.pop() : undefined;
  const city = parts?.[1] ? parts?.pop() : undefined;
  const street = parts?.[0] ? parts?.join(',') : undefined;
  const parseZipCodeAndState = zipCodeAndState
    ? zipCodeAndState?.split(' ')?.map((part) => part.trim())
    : undefined;

  return {
    country,
    zipCode: parseZipCodeAndState?.[1],
    state: parseZipCodeAndState?.[0],
    city,
    street,
  };
};

export const isAddressStreet = (street: string) => {
  const isStreet = REG_IS_STRESS.test(street);
  return isStreet;
};

export const connectPage = async (url: string) => {
  let tryCount = 0;
  const timeoutDuration = 5000;
  while (tryCount < 3) {
    try {
      tryCount > 0 && console.log('tryCount');
      const responsePromise = fetch(url, {
        method: METHOD.GET,
        headers: DEFAULT_OPTION_HEADER_FETCH,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Connection timed out'));
        }, timeoutDuration);
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);
      if (response instanceof Response && response.ok) return response;
      tryCount++;
    } catch {
      tryCount++;
      await setDelay(2000);
      continue;
    }
  }
};

export const chunkArray = (arrayOfObjects: any[], chunkSize: number) => {
  return Array.from(
    { length: Math.ceil(arrayOfObjects.length / chunkSize) },
    (_, index) =>
      arrayOfObjects
        .slice(index * chunkSize, (index + 1) * chunkSize)
        .map((item) => ({ ...item })),
  );
};

export const executeWithTimeout = async (fn: () => void, time: number) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(console.log('Time out!'));
    }, time);
  });

  return await Promise.race([fn(), timeoutPromise]);
};
