import { Prisma } from '@prisma/client'
import { IRmrkExtensionHandler } from 'rmrk-tools/dist/tools/consolidator/adapters/types'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { RMRK_DAO_PREFIX, INTERACTION_TYPES } from '../app-constants'
import { IRmrkDaoDatabaseAdapter } from './database-adapter'
import { Propose } from './interactions/propose'
import { Register } from './interactions/register'
import { prisma } from '../db'

export class RmrkExtensionHandler implements IRmrkExtensionHandler {
  prefix: string = RMRK_DAO_PREFIX

  public constructor(private db: IRmrkDaoDatabaseAdapter) {}

  public async processRemark(remark: Remark) {
    // Only process RMRK2 remarks
    if (parseFloat(remark.version) !== 2) {
      return console.log('Only processes version 2.0.0')
    }

    switch (remark.interaction_type.toUpperCase()) {
      case INTERACTION_TYPES.REGISTER:
        {
          return await this.register(remark)
        }
        break
      case INTERACTION_TYPES.PROPOSE:
        {
          return await this.propose(remark)
        }
        break
      case INTERACTION_TYPES.VOTE:
        {
          return await this.vote(remark)
        }
        break
      case INTERACTION_TYPES.DEREGISTER:
        {
          return await this.deregister(remark)
        }
        break
      default: {
        return false
      }
    }
  }

  private async register(remark: Remark): Promise<any> {
    // TODO: Possibly move this logic into the fromRemark method and use the IRmrkDatabaseAdapter
    let registerInteraction: Register
    try {
      registerInteraction = Register.fromRemark(remark)
    } catch (e) {
      console.log('Invalid REGISTER', e)
      return true
    }

    // Find possible CUSTODIAN entity with matching caller's address
    const existingCustodian = await prisma.custodian.findUnique({
      where: { custodian: remark.caller },
    })

    if (!existingCustodian) {
      await prisma.custodian.create({
        data: {
          block: registerInteraction.block,
          custodian: registerInteraction.custodian,
          voteFee: registerInteraction.voteFee,
          proposalFee: registerInteraction.proposalFee,
          recertifyFee: registerInteraction.recertifyFee,
          maxOptions: registerInteraction.maxOptions,
          changes: [],
        },
      })
    } else {
      // Update existing CUSTODIAN entity (@see https://github.com/adamsteeber/rmrkdao-spec/issues/10)
      let changes = existingCustodian.changes as Prisma.JsonArray
      changes.push({ ...existingCustodian, changes: undefined }) // TODO: Consider more optimal changes schema
      await prisma.custodian.update({
        where: { custodian: registerInteraction.custodian },
        data: {
          block: registerInteraction.block,
          custodian: registerInteraction.custodian,
          voteFee: registerInteraction.voteFee,
          proposalFee: registerInteraction.proposalFee,
          recertifyFee: registerInteraction.recertifyFee,
          maxOptions: registerInteraction.maxOptions,
          changes,
        },
      })
    }
  }

  private async propose(remark: Remark): Promise<any> {
    try {
      const proposeInteraction = await Propose.fromRemark(remark, this.db)
      await proposeInteraction.save(this.db)
    } catch (e) {
      // TODO: Save error to database
    }
  }

  private async vote(remark: Remark): Promise<any> {
    return false
  }

  private async deregister(remark: Remark): Promise<any> {
    return false
  }
}
