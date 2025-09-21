import axios from 'axios';

const AUTH_ID = process.env.PLIVO_AUTH_ID!;
const AUTH_TOKEN = process.env.PLIVO_AUTH_TOKEN!;

export async function createPlivoCall(from: string, to: string, answerUrl: string) {
  const url = `https://api.plivo.com/v1/Account/${AUTH_ID}/Call/`;
  const payload = { from, to, answer_url: answerUrl };
  const resp = await axios.post(url, payload, { auth: { username: AUTH_ID, password: AUTH_TOKEN } });
  return resp.data;
}
