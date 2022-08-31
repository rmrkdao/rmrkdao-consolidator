export interface IRegisterPayload {
  proposalFee: string
  voteFee: string
  recertifyFee: string
  maxOptions: number
}

export interface ICustodian extends IRegisterPayload {
  block: number
  custodian: string
}

export interface IProposePayload {
  id: string
  custodian: string
  name: string
  description: string
  collections: string[]
  options: string[]
  snapshot: number | null
  passingThreshold: number | null
  startDate: number | null
  endDate: number
  nftWeight: boolean
  electorate: boolean
}

export interface IValidatedProposePayload extends IProposePayload {
  snapshot: number
  startDate: number
}

export interface IProposal extends IValidatedProposePayload {
  block: number
}

export const isIValidatedPayload = (
  input: IProposePayload
): input is IValidatedProposePayload => {
  if (input.snapshot === null || input.startDate === null) {
    return false
  } else {
    return true
  }
}
