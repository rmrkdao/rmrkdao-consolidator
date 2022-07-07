import { Base2, Collection2, Nft2, Prisma } from '@prisma/client'
import { NFT, Base, Collection } from 'rmrk-tools'
import { AcceptEntityType } from 'rmrk-tools/dist/classes/accept'
import { IConsolidatorAdapter } from 'rmrk-tools/dist/tools/consolidator/adapters/types'
import {
  NFTConsolidated,
  CollectionConsolidated,
  BaseConsolidated,
} from 'rmrk-tools/dist/tools/consolidator/consolidator'
import { prisma } from '../db'

export class PgAdapter implements IConsolidatorAdapter {
  public async getAllNFTs() {
    const nfts = await prisma.nft2.findMany()

    const nftMap: Record<string, NFTConsolidated> = {}

    nfts.forEach((nft) => {
      nftMap[nft.id] = PgAdapter.convertNftFromDB(nft)
    })

    return nftMap
  }

  public async getAllCollections() {
    const collections = await prisma.collection2.findMany()
    const collectionMap: Record<string, CollectionConsolidated> = {}
    collections.forEach(
      (collection) =>
        (collectionMap[collection.id] =
          PgAdapter.convertCollectionFromDB(collection))
    )
    return collectionMap
  }

  public async getAllBases() {
    const bases = await prisma.base2.findMany()
    const baseMap: Record<string, BaseConsolidated> = {}
    bases.forEach(
      (base) => (baseMap[base.id] = PgAdapter.convertBaseFromDB(base))
    )
    return baseMap
  }

  /**
   * @mutation
   */
  public async updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        reactions: nft?.reactions,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateBaseEquippable(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    await prisma.base2.update({
      where: { id: consolidatedBase.id },
      data: {
        parts: base?.parts as any,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        forsale: nft?.forsale,
        changes: nft?.changes,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateEquip(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        children: JSON.parse(JSON.stringify(nft.children)),
        // TODO: Track equip changes in changes array
      },
    })
  }

  /**
   * @mutation
   */
  public async updateSetPriority(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        priority: nft.priority,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateSetAttribute(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        properties: nft.properties as any,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateNftAccept(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    entity: AcceptEntityType
  ) {
    let data: Prisma.Nft2UpdateArgs['data'] = { priority: nft.priority }
    if (entity == 'NFT') {
      data.children = nft.children as any
    } else if (entity === 'RES') {
      data.resources = nft.resources as any
    }

    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data,
    })
  }

  /**
   * @mutation
   */
  public async updateNftResadd(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        resources: nft.resources as any,
        priority: nft.priority,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateNFTChildrenRootOwner(
    nft: NFT | NFTConsolidated,
    rootowner?: string,
    level?: number
  ) {
    let updatedChildren: string[] = []
    if ((level || 1) < 10 && nft.children && nft.children.length > 0) {
      const promises = nft.children.map(async (child) => {
        updatedChildren.push(child.id)
        const childNft = await this.getNFTById(child.id)
        if (childNft?.children && childNft?.children.length > 0) {
          const updatedGrandChildren = await this.updateNFTChildrenRootOwner(
            childNft,
            rootowner || nft.rootowner,
            (level || 1) + 1
          )

          updatedChildren = updatedChildren.concat(updatedGrandChildren)
        }
        await prisma.nft2.update({
          where: { id: child.id },
          data: {
            forsale: BigInt(0),
            rootowner: rootowner || nft.rootowner,
          },
        })
      })

      await Promise.all(promises)
    }

    return updatedChildren
  }

  /**
   * @mutation
   */
  public async updateNFTBuy(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        owner: nft?.owner,
        rootowner: nft?.rootowner,
        changes: nft?.changes,
        forsale: nft?.forsale,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateNFTSend(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        changes: nft?.changes,
        owner: nft?.owner,
        rootowner: nft?.rootowner,
        forsale: BigInt(0),
        pending: nft?.pending,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateNFTBurn(
    nft: NFT | NFTConsolidated,
    consolidatedNFT: NFTConsolidated
  ) {
    await prisma.$transaction([
      prisma.nft2.update({
        where: { id: consolidatedNFT.id },
        data: {
          burned: nft?.burned,
          changes: nft?.changes,
          equipped: '',
          forsale: BigInt(nft.forsale) > BigInt(0) ? BigInt(0) : nft.forsale,
        },
      }),
      // Decrement collection count
      prisma.collection2.update({
        where: { id: consolidatedNFT.collection },
        data: {
          count: { decrement: 1 },
        },
      }),
    ])
  }

  /**
   * @mutation
   */
  public async updateNFTMint(nft: NFT) {
    await prisma.$transaction([
      prisma.nft2.create({
        data: {
          id: nft.getId(),
          block: nft.block,
          collection: nft.collection,
          symbol: nft.symbol,
          transferable: nft.transferable,
          sn: nft.sn,
          metadata: nft.metadata,
          forsale: nft.forsale,
          reactions: JSON.parse(JSON.stringify(nft.reactions)),
          changes: JSON.parse(JSON.stringify(nft.changes)),
          owner: nft.owner,
          rootowner: nft.rootowner,
          burned: nft.burned,
          priority: nft.priority,
          children: JSON.parse(JSON.stringify(nft.children)),
          resources: JSON.parse(JSON.stringify(nft.resources)),
          properties: JSON.parse(JSON.stringify(nft.properties)),
          pending: nft.pending,
          equipped: null,
        },
      }),
      // Increment collection count
      prisma.collection2.update({
        where: { id: nft.collection },
        data: {
          count: { increment: 1 },
        },
      }),
    ])
  }

  /**
   * @mutation
   */
  public async updateCollectionMint(collection: CollectionConsolidated) {
    return await prisma.collection2.create({
      data: {
        ...collection,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateCollectionDestroy(collection: CollectionConsolidated) {
    return await prisma.collection2.delete({ where: { id: collection.id } })
  }

  /**
   * @mutation
   */
  public async updateCollectionLock(collection: CollectionConsolidated) {
    const nfts = await this.getNFTsByCollection(collection.id)
    return await prisma.collection2.update({
      where: { id: collection.id },
      data: {
        max: (nfts || []).filter((nft) => nft.burned === '').length,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateBase(base: Base) {
    return await prisma.base2.create({
      data: {
        id: base.getId(),
        block: base.block,
        symbol: base.symbol,
        issuer: base.issuer,
        type: base.type,
        parts: base.parts as any,
        changes: base.changes,
        themes: base.themes,
        metadata: base.metadata,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateBaseThemeAdd(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    await prisma.base2.update({
      where: { id: consolidatedBase.id },
      data: {
        themes: base?.themes,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated
  ) {
    await prisma.collection2.update({
      where: { id: consolidatedCollection.id },
      data: {
        issuer: collection.issuer,
        changes: collection.changes,
      },
    })
  }

  /**
   * @mutation
   */
  public async updateBaseIssuer(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    await prisma.base2.update({
      where: { id: consolidatedBase.id },
      data: {
        issuer: base?.issuer,
        changes: base?.changes,
      },
    })
  }

  public async getNFTsByCollection(collectionId: string) {
    return (
      await prisma.nft2.findMany({ where: { collection: collectionId } })
    ).map(PgAdapter.convertNftFromDB)
  }

  public async getNFTById(id: string) {
    return this.getNFTByIdUnique(id)
  }

  public async getCollectionById(id: string) {
    const collection = await prisma.collection2.findUnique({ where: { id } })
    return collection
      ? PgAdapter.convertCollectionFromDB(collection)
      : undefined
  }

  /**
   * Find existing NFT by id
   */
  public async getNFTByIdUnique(id: string) {
    const nftFromDb = await prisma.nft2.findUnique({ where: { id } })
    if (nftFromDb === null) {
      return undefined
    }
    return PgAdapter.convertNftFromDB(nftFromDb)
  }

  public async getBaseById(id: string) {
    const base = await prisma.base2.findUnique({ where: { id } })
    return base ? PgAdapter.convertBaseFromDB(base) : undefined
  }

  static convertNftFromDB(nft: Nft2): NFTConsolidated {
    return {
      id: nft.id,
      block: nft.block,
      collection: nft.collection,
      symbol: nft.symbol,
      transferable: nft.transferable,
      sn: nft.sn,
      metadata: nft.metadata || undefined,
      forsale: nft.forsale,
      reactions: JSON.parse(JSON.stringify(nft.reactions)),
      changes: JSON.parse(JSON.stringify(nft.changes)),
      owner: nft.owner,
      rootowner: nft.rootowner,
      burned: nft.burned,
      priority: nft.priority as string[],
      children: JSON.parse(JSON.stringify(nft.children)),
      resources: JSON.parse(JSON.stringify(nft.resources)),
      properties: JSON.parse(JSON.stringify(nft.properties)),
      pending: nft.pending,
      equipped: nft.equipped || undefined,
    }
  }

  static convertCollectionFromDB(
    collection: Collection2
  ): CollectionConsolidated {
    return {
      ...collection,
      changes: collection.changes as any,
    }
  }

  static convertBaseFromDB(base: Base2): BaseConsolidated {
    return {
      ...base,
      type: base.type as any,
      parts: base.parts as any,
      changes: base.changes as any,
      themes: base.themes as any,
      metadata: base.metadata || undefined,
    }
  }

  async updateLastRemarkMeta() {
    // Consider the case of updateNFTSend and then multiple calls of updateNFTChildrenRootOwner.
    // Also, consider possibly save insert/update statements as a way to snapshot the rows to be updated for a given remark before each of the database mutations per remark to be processed.
    // After the remark is fully processed, then those insert/update statements can be removed atomically when the `last_processed_rmrk` row is updated.
  }
}
