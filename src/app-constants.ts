export const RMRK_DAO_PREFIX = 'RMRKDAO'
export const LISTENING_PREFIX_LIST = [
  'rmrk',
  'RMRK',
  RMRK_DAO_PREFIX.toLowerCase(),
  RMRK_DAO_PREFIX,
]
export const VERSION = '2.0.0'
export enum INTERACTION_TYPES {
  REGISTER = 'REGISTER',
  PROPOSE = 'PROPOSE',
  VOTE = 'VOTE',
  DEREGISTER = 'DEREGISTER',
  SUBMIT = 'SUBMIT',
}

/**
 * The Kusama address type
 * @see https://guide.kusama.network/docs/learn-accounts#for-the-curious-how-prefixes-work
 */
export const KUSAMA_SS58_FORMAT = 2

export const KUSAMA_NODE_WS = process.env.KUSAMA_NODE_WS || ''
