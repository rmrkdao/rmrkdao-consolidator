import os from 'os'
import { prisma } from '../db'

export class ConsolidationLock {
  /** The pseudo user in the form `<host>-<pid>` */
  user: string
  /** Pseudo-random string that is stored by the class in order to help uniquely identify the process that has acquired the lock */
  key: string | undefined

  /**
   * Manages acquired and releasing a lock for a specified consolidation version
   */
  public constructor(
    /** Target consolidation version */
    public version: string
  ) {
    this.user = `${os.hostname()}-${process.pid}`
  }

  /**
   *  Attempts to acquire a lock and retries for timeoutMilliseconds
   * @param {number} timeoutMilliSeconds
   * @returns {Promise<boolean>}
   */
  public async wait(timeoutMilliSeconds: number): Promise<boolean> {
    if (await this.lock()) {
      return true
    } else {
      return new Promise((resolve) => {
        let timeout: NodeJS.Timeout | undefined
        let interval: NodeJS.Timer | undefined

        interval = setInterval(async () => {
          if (await this.lock()) {
            clearInterval(interval)
            clearTimeout(timeout)
            resolve(true)
          }
        }, 1000)
        timeout = setTimeout(() => {
          clearInterval(interval)
          resolve(false)
        }, timeoutMilliSeconds)
      })
    }
  }

  /**
   * Releases the lock
   * @returns {Promise<string | undefined>}
   */
  public async unlock(): Promise<string | undefined> {
    try {
      const key = this.key
      const result = await prisma.consolidationLock.deleteMany({
        where: { version: this.version, user: this.user, key },
      })
      if (result.count > 0) {
        this.key = undefined
        return key
      } else {
        return undefined
      }
    } catch (e) {
      console.error(e)
      return undefined
    }
  }

  /**
   * Attempts to acquire a lock from the database
   */
  private async lock(): Promise<boolean> {
    try {
      const { key } = await prisma.consolidationLock.create({
        data: { version: this.version, user: this.user },
      })
      this.key = key
      return true
    } catch (e) {
      return false
    }
  }
}
