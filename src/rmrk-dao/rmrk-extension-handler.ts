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
    let registerInteraction: Register
    try {
      registerInteraction = Register.fromRemark(remark)
    } catch (e) {
      // TODO: Save error to database
      console.log('Invalid REGISTER', (e as Error).message)
      return
    }

    await registerInteraction.save(this.db)

    // Log success
    console.log(
      `Processed REGISTER for CUSTODIAN ${registerInteraction.custodian}`
    )
  }

  private async propose(remark: Remark): Promise<any> {
    let proposeInteraction: Propose | undefined
    try {
      proposeInteraction = await Propose.fromRemark(remark, this.db)
    } catch (e) {
      // TODO: Save error to database
      console.log('Invalid PROPOSE', (e as Error).message)
      return
    }

    // Stop execution if error saving to database (don't catch error)
    await proposeInteraction.save(this.db)

    // Log success
    console.log(`Processed PROPOSE for PROPOSAL ${proposeInteraction.id}`)
  }

  private async vote(remark: Remark): Promise<any> {
    console.log('VOTE is not implemented')
    return false
  }

  private async deregister(remark: Remark): Promise<any> {
    console.log('DEREGISTER is not implemented')
    return false
  }
}
