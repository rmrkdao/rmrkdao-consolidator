import '../patch'

import { Consolidator } from 'rmrk-tools'
import { PgAdapter } from './pg-adapter'
import {
  filterByUnProcessedRemarks,
  getRemarks,
  prefixes,
  restoreFromHistory,
} from './utils'
import { prisma } from '../db'
import { LatestConsolidatingRmrkStatus } from '@prisma/client'

export const consolidate = async (data: any[], ss58Format: number) => {
  const remarks = getRemarks(data, prefixes, ss58Format)

  // Get the latest consolidation info
  // TODO: Confirm assumption that this will throw error when database is not available
  const consolidationInfo = await prisma.consolidationInfo.findUnique({
    where: { version: '2.0.0' },
  })

  if (consolidationInfo) {
    // If last remark was still processing, then the database is dirty.
    if (consolidationInfo.status === LatestConsolidatingRmrkStatus.processing) {
      // Restore to last processed remark by undoing the changes that are in the History2 table
      await restoreFromHistory()
    }
    // Filter out the processed remarks
    // Filters in place
    filterByUnProcessedRemarks(
      remarks,
      consolidationInfo.latestBlock,
      consolidationInfo.latestRmrkOffset,
      consolidationInfo.status
    )
  }
  console.log('got remarks', remarks.length)
  const pgAdapter = new PgAdapter()
  const consolidator = new Consolidator(ss58Format, pgAdapter)
  await consolidator.consolidate(remarks)
}
