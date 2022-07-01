import { Nft2, Prisma } from '@prisma/client'
import { NFT, Base, Collection, consolidatedNFTtoInstance } from 'rmrk-tools'
import { AcceptEntityType } from 'rmrk-tools/dist/classes/accept'
import { IConsolidatorAdapter } from 'rmrk-tools/dist/tools/consolidator/adapters/types'
import {
  NFTConsolidated,
  CollectionConsolidated,
  BaseConsolidated,
} from 'rmrk-tools/dist/tools/consolidator/consolidator'
import { prisma } from '../db'

export class PgAdapter implements IConsolidatorAdapter {
  public collections: Record<string, CollectionConsolidated>
  public bases: Record<string, BaseConsolidated>
  constructor() {
    this.collections = {}
    this.bases = {}
  }

  public async getAllNFTs() {
    const nfts = await prisma.nft2.findMany()

    const nftMap: Record<string, NFTConsolidated> = {}

    nfts.forEach((nft) => {
      nftMap[nft.id] = PgAdapter.convertFromDBFormat(nft)
    })

    return nftMap
  }

  public async getAllCollections() {
    return this.collections
  }

  public async getAllBases() {
    return this.bases
  }

  public async updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        reactions: nft?.reactions,
      },
    })
  }

  public async updateBaseEquippable(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    this.bases[consolidatedBase.id] = {
      ...this.bases[consolidatedBase.id],
      parts: base?.parts,
    }
  }

  public async updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        forsale: nft?.forsale,
        changes: nft?.changes,
      },
    })
  }

  public async updateEquip(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        children: JSON.parse(JSON.stringify(nft.children)),
        // TODO: Track equip changes in changes array
      },
    })
  }

  public async updateSetPriority(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        priority: nft.priority,
      },
    })
  }

  public async updateSetAttribute(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        properties: nft.properties as any,
      },
    })
  }

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

  public async updateNftResadd(nft: NFT, consolidatedNFT: NFTConsolidated) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        resources: nft.resources as any,
        priority: nft.priority,
      },
    })
  }

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

  public async updateNFTBurn(
    nft: NFT | NFTConsolidated,
    consolidatedNFT: NFTConsolidated
  ) {
    await prisma.nft2.update({
      where: { id: consolidatedNFT.id },
      data: {
        burned: nft?.burned,
        changes: nft?.changes,
        equipped: '',
        forsale: BigInt(nft.forsale) > BigInt(0) ? BigInt(0) : nft.forsale,
      },
    })

    // TODO: convert to pg
    this.collections[consolidatedNFT.collection].count =
      this.collections[consolidatedNFT.collection].count - 1
  }

  public async updateNFTMint(nft: NFT) {
    await prisma.nft2.create({
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
    })

    // TODO:
    this.collections[nft.collection].count =
      this.collections[nft.collection].count + 1
  }

  public async updateCollectionMint(collection: CollectionConsolidated) {
    return (this.collections[collection.id] = collection)
  }

  public async updateCollectionDestroy(collection: CollectionConsolidated) {
    return delete this.collections[collection.id]
  }

  public async updateCollectionLock(collection: CollectionConsolidated) {
    const nfts = await this.getNFTsByCollection(collection.id)
    return (this.collections[collection.id] = {
      ...collection,
      max: (nfts || []).filter((nft) => nft.burned === '').length,
    })
  }

  public async updateBase(base: Base) {
    return (this.bases[base.getId()] = {
      ...base,
      id: base.getId(),
    })
  }

  public async updateBaseThemeAdd(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    this.bases[consolidatedBase.id] = {
      ...this.bases[consolidatedBase.id],
      themes: base?.themes,
    }
  }

  public async updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated
  ) {
    this.collections[consolidatedCollection.id] = {
      ...this.collections[consolidatedCollection.id],
      issuer: collection?.issuer,
      changes: collection?.changes,
    }
  }

  public async updateBaseIssuer(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    this.bases[consolidatedBase.id] = {
      ...this.bases[consolidatedBase.id],
      issuer: base?.issuer,
      changes: base?.changes,
    }
  }

  public async getNFTsByCollection(collectionId: string) {
    return (
      await prisma.nft2.findMany({ where: { collection: collectionId } })
    ).map(PgAdapter.convertFromDBFormat)
  }

  public async getNFTById(id: string) {
    return this.getNFTByIdUnique(id)
  }

  public async getCollectionById(id: string) {
    return this.collections[id]
  }

  /**
   * Find existing NFT by id
   */
  public async getNFTByIdUnique(id: string) {
    const nftFromDb = await prisma.nft2.findUnique({ where: { id } })
    if (nftFromDb === null) {
      return undefined
    }
    return PgAdapter.convertFromDBFormat(nftFromDb)
  }

  public async getBaseById(id: string) {
    return this.bases[id]
  }

  static convertFromDBFormat(nft: Nft2): NFTConsolidated {
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
}
