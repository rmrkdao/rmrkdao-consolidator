import {
  INTERACTION_TYPES,
  RMRK_DAO_PREFIX,
  VERSION,
} from '../../app-constants'
import { IResult } from '../election-office/types'

export class ResultEntity {
  public constructor(private data: IResult) {}

  public toRemark() {
    const urlEncodedPayload = encodeURIComponent(JSON.stringify(this.data))
    return `${RMRK_DAO_PREFIX}::${INTERACTION_TYPES.SUBMIT}::${VERSION}::${urlEncodedPayload}`
  }
}
