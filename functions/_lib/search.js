import { bdSearch } from './brightdata.js';
/** Web search for Medint: Google through Bright Data's SERP zone only (BRIGHTDATA_API_KEY + BRIGHTDATA_SERP_ZONE). → { organic: [{title, link, snippet}], kg, via, error } */
export async function webSearch(env, q, num = 8) { return bdSearch(env, q, num); }
