import { getConfig, setConfig } from '../jobStore.js';

export function get(key){
  if(key){
    console.log(getConfig(key));
  } else {
    console.log('backoff_base =', getConfig('backoff_base'));
    console.log('max_retries_default =', getConfig('max_retries_default'));
  }
}

export function set(key, value){
  setConfig(key, value);
  console.log('OK');
}
