import { Counter } from 'prom-client'
import { IRmrkExtensionHandler } from 'rmrk-tools/dist/tools/consolidator/adapters/types'
import { Remark } from 'rmrk-tools/dist/tools/consolidator/remark'
import { INTERACTION_TYPES, RMRK_DAO_PREFIX } from '../app-constants'
import { IRmrkDaoDatabaseAdapter } from './database-adapter'
import { Propose } from './interactions/propose'
import { Register } from './interactions/register'
import { SubmitInteraction } from './interactions/submit'
import { VoteInteraction } from './interactions/vote'

const rmrkdaoInteractionOutcome = new Counter({
  name: 'rmrkdao_interaction_outcome',
  help: 'RMRKDAO interaction outcome (succeeded or failed by type)',
  labelNames: ['interaction', 'outcome'],
})

enum Outcome {
  succeeded = 'succeeded',
  failed = 'failed',
}

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
      case INTERACTION_TYPES.SUBMIT:
        {
          return await this.submit(remark)
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
      // Only catch potential interaction parsing failure (let other errors crash process)
      registerInteraction = Register.fromRemark(remark)
    } catch (e) {
      // TODO: Save error to database
      console.log(`Invalid ${INTERACTION_TYPES.REGISTER}`, (e as Error).message)
      rmrkdaoInteractionOutcome.inc({
        interaction: INTERACTION_TYPES.REGISTER,
        outcome: Outcome.failed,
      })
      return
    }

    await registerInteraction.save(this.db)

    // Log success
    console.log(
      `Processed ${INTERACTION_TYPES.REGISTER} for CUSTODIAN ${registerInteraction.id}`
    )

    rmrkdaoInteractionOutcome.inc({
      interaction: INTERACTION_TYPES.REGISTER,
      outcome: Outcome.succeeded,
    })
  }

  private async propose(remark: Remark): Promise<any> {
    let proposeInteraction: Propose | undefined
    try {
      // Only catch potential interaction parsing failure (let other errors crash process)
      proposeInteraction = await Propose.fromRemark(remark, this.db)
    } catch (e) {
      // TODO: Save error to database
      console.log(`Invalid ${INTERACTION_TYPES.PROPOSE}`, (e as Error).message)
      rmrkdaoInteractionOutcome.inc({
        interaction: INTERACTION_TYPES.PROPOSE,
        outcome: Outcome.failed,
      })
      return
    }

    // Stop execution if error saving to database (don't catch error)
    await proposeInteraction.save(this.db)

    // Log success
    console.log(
      `Processed ${INTERACTION_TYPES.PROPOSE} for PROPOSAL ${proposeInteraction.id}`
    )

    rmrkdaoInteractionOutcome.inc({
      interaction: INTERACTION_TYPES.PROPOSE,
      outcome: Outcome.succeeded,
    })
  }

  private async vote(remark: Remark): Promise<any> {
    let voteInteraction: VoteInteraction | undefined
    try {
      // Only catch potential interaction parsing failure (let other errors crash process)
      voteInteraction = await VoteInteraction.fromRemark(remark, this.db)
    } catch (e) {
      // TODO: Save error to database
      console.log(`Invalid ${INTERACTION_TYPES.VOTE}`, (e as Error).message)
      rmrkdaoInteractionOutcome.inc({
        interaction: INTERACTION_TYPES.VOTE,
        outcome: Outcome.failed,
      })
      return
    }

    // Stop execution if error saving to database (don't catch error)
    await voteInteraction.save(this.db)

    // Log success
    console.log(`Processed ${INTERACTION_TYPES.VOTE} ${voteInteraction.id}`)

    rmrkdaoInteractionOutcome.inc({
      interaction: INTERACTION_TYPES.VOTE,
      outcome: Outcome.succeeded,
    })
  }

  private async submit(remark: Remark): Promise<any> {
    let submitInteraction: SubmitInteraction | undefined
    try {
      // Only catch potential interaction parsing failure (let other errors crash process)
      submitInteraction = await SubmitInteraction.fromRemark(remark, this.db)
    } catch (e) {
      // TODO: Save error to database
      console.log(`Invalid ${INTERACTION_TYPES.SUBMIT}`, (e as Error).message)
      rmrkdaoInteractionOutcome.inc({
        interaction: INTERACTION_TYPES.SUBMIT,
        outcome: Outcome.failed,
      })
      return
    }

    // Stop execution if error saving to database (don't catch error)
    await submitInteraction.save(this.db)

    // Log success
    console.log(`Processed ${INTERACTION_TYPES.SUBMIT} ${submitInteraction.id}`)
    rmrkdaoInteractionOutcome.inc({
      interaction: INTERACTION_TYPES.SUBMIT,
      outcome: Outcome.succeeded,
    })
  }

  private async deregister(remark: Remark): Promise<any> {
    console.log('DEREGISTER is not implemented')
    rmrkdaoInteractionOutcome.inc({
      interaction: INTERACTION_TYPES.DEREGISTER,
      outcome: Outcome.failed,
    })
    return false
  }
}
