import '../patch'

import { Consolidator, getRemarksFromBlocks } from 'rmrk-tools'
import { PgAdapter } from './pg-adapter'
import {
  filterByUnProcessedRemarks,
  prefixes,
  restoreFromHistory,
} from './utils'
import { prisma } from '../db'
import { LatestConsolidatingRmrkStatus } from '@prisma/client'
import { PgDatabaseAdapter } from '../rmrk-dao/database-adapter/pg-database-adapter'
import { RmrkExtensionHandler } from '../rmrk-dao/rmrk-extension-handler'

export const consolidate = async (data: any[], ss58Format: number) => {
  const remarks = getRemarksFromBlocks(data, prefixes, ss58Format)

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
      console.warn('restored history')
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

  // TODO: Consider creating these objects once per lifetime of the program
  const pgAdapter = new PgAdapter()
  const rmrkDaoDb = new PgDatabaseAdapter()
  const remarkExtensionHandler = new RmrkExtensionHandler(rmrkDaoDb)

  const consolidator = new Consolidator(
    ss58Format,
    pgAdapter,
    false,
    false,
    remarkExtensionHandler
  )
  await consolidator.consolidate(remarks)
}
