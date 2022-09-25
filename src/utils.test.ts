import Joi, { CustomHelpers } from 'joi'
import { proposalOptionsValidator } from './utils'

//@ts-ignore
const helper: CustomHelpers = ''

describe('proposalOptionsValidator', () => {
  test('working example', () => {
    const value = { '0': 'Apples', '1': 'Bananas', '2': 'Cherries' }
    const result = proposalOptionsValidator(value, helper)
    expect(result).toMatchInlineSnapshot(`
Object {
  "0": "Apples",
  "1": "Bananas",
  "2": "Cherries",
}
`)
  })

  test('value is array', () => {
    const value = ['Apples', 'Bananas', 'Cherries']
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Value must be a object dictionary')
  })

  test('value is null', () => {
    const value = null
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Value must be a object dictionary')
  })

  test('value is string', () => {
    const value = 'option 1'
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Value must be a object dictionary')
  })

  test('key is float', () => {
    const value = { '0.1': 'Apples', '1': 'Bananas', '2': 'Cherries' }
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Keys must be non-negative integer string')
  })

  test('key is -1', () => {
    const value = { '-1': 'Apples', '1': 'Bananas', '2': 'Cherries' }
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Keys must be non-negative integer string')
  })

  test('option is not a string', () => {
    const value = { '0': 0, '1': 'Bananas', '2': 'Cherries' }
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Option values must be strings')
  })

  test('option is too large', () => {
    const value = {
      '0': Array(10001).fill('0').join(''),
      '1': 'Bananas',
      '2': 'Cherries',
    }
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Options cannot have a text length larger than 10000')
  })

  test('less than 2 options', () => {
    const value = { '0': 'Apples' }
    expect(() => {
      proposalOptionsValidator(value, helper)
    }).toThrowError('Must have at least 2 options')
  })
})
