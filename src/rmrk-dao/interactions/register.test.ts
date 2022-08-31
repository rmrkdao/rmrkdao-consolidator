import { Register } from './register'

describe('Should parse valid REGISTER interactions payloads', () => {
  it('Parse valid payload', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        proposalFee: '2000',
        voteFee: '1000',
        recertifyFee: '3000',
        maxOptions: 100,
      })
    )
    const result = Register.parseData(happyDayRegisterRawPayload)

    expect(result.proposalFee).toBe(BigInt('2000'))
    expect(result.voteFee).toBe(BigInt('1000'))
    expect(result.recertifyFee).toBe(BigInt('3000'))
    expect(result.maxOptions).toBe(100)
  })

  it('Throw exception due to missing proposalFee in payload', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        voteFee: '1000',
        recertifyFee: '3000',
        maxOptions: 100,
      })
    )
    expect(() => {
      const result = Register.parseData(happyDayRegisterRawPayload)
    }).toThrowError(`"proposalFee" is required`)
  })

  it('Throw exception due to missing voteFee in payload', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        proposalFee: '2000',
        recertifyFee: '3000',
        maxOptions: 100,
      })
    )
    expect(() => {
      const result = Register.parseData(happyDayRegisterRawPayload)
    }).toThrowError(`"voteFee" is required`)
  })

  it('Throw exception due to missing recertifyFee in payload', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        proposalFee: '2000',
        voteFee: '1000',
        maxOptions: 100,
      })
    )
    expect(() => {
      const result = Register.parseData(happyDayRegisterRawPayload)
    }).toThrowError(`"recertifyFee" is required`)
  })

  it('Throw exception due to missing maxOptions in payload', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        proposalFee: '2000',
        voteFee: '1000',
        recertifyFee: '3000',
      })
    )
    expect(() => {
      const result = Register.parseData(happyDayRegisterRawPayload)
    }).toThrowError(`"maxOptions" is required`)
  })

  it('Throw exception due to negative proposalFee in payload', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        proposalFee: '-2000',
        voteFee: '1000',
        recertifyFee: '3000',
        maxOptions: 100,
      })
    )
    expect(() => {
      const result = Register.parseData(happyDayRegisterRawPayload)
    }).toThrowError(
      `"proposalFee" failed custom validation because Value cannot be negative`
    )
  })

  it('Allow proposal fee of 0', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        proposalFee: '0',
        voteFee: '1000',
        recertifyFee: '3000',
        maxOptions: 100,
      })
    )
    const result = Register.parseData(happyDayRegisterRawPayload)

    expect(result.proposalFee).toBe(BigInt(0))
    expect(result.voteFee).toBe(BigInt('1000'))
    expect(result.recertifyFee).toBe(BigInt('3000'))
    expect(result.maxOptions).toBe(100)
  })

  it('Allow values to be of different types', () => {
    const happyDayRegisterRawPayload = encodeURIComponent(
      JSON.stringify({
        proposalFee: 2000,
        voteFee: 1000,
        recertifyFee: 3000,
        maxOptions: '100',
      })
    )

    const result = Register.parseData(happyDayRegisterRawPayload)

    expect(result.proposalFee).toBe(BigInt(2000))
    expect(result.voteFee).toBe(BigInt(1000))
    expect(result.recertifyFee).toBe(BigInt(3000))
    expect(result.maxOptions).toBe(100)
  })
})
