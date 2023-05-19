import { CodeError } from '@libp2p/interfaces/errors'
import { logger } from '@libp2p/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { anySignal } from 'any-signal'
import toIt from 'browser-readablestream-to-it'
import toBuffer from 'it-to-buffer'
import defer from 'p-defer'
import PQueue from 'p-queue'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import type { ContentRouting } from '@libp2p/interface-content-routing'
import type { PeerInfo } from '@libp2p/interface-peer-info'
import type { AbortOptions } from '@libp2p/interfaces'
import type { Startable } from '@libp2p/interfaces/startable'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { CID } from 'multiformats/cid'

const log = logger('reframe-content-routing')

export interface ReframeV1Response {
  Providers: ReframeV1ResponseItem[]
}

export interface ReframeV1ResponseItem {
  ID: string
  Addrs: string[]
  Protocol: string
  Schema: string
}

export interface ReframeContentRoutingInit {
  /**
   * A concurrency limit to avoid request flood in web browser (default: 4)
   *
   * @see https://github.com/libp2p/js-libp2p-delegated-content-routing/issues/12
   */
  concurrentRequests?: number

  /**
   * How long a request is allowed to take in ms (default: 30 seconds)
   */
  timeout?: number
}

const defaultValues = {
  concurrentRequests: 4,
  timeout: 30e3
}

/**
 * An implementation of content routing, using a delegated peer
 */
class ReframeContentRouting implements ContentRouting, Startable {
  private started: boolean
  private readonly httpQueue: PQueue
  private readonly shutDownController: AbortController
  private readonly clientUrl: URL
  private readonly timeout: number

  /**
   * Create a new DelegatedContentRouting instance
   */
  constructor (url: string | URL, init: ReframeContentRoutingInit = {}) {
    this.started = false
    this.shutDownController = new AbortController()
    this.httpQueue = new PQueue({
      concurrency: init.concurrentRequests ?? defaultValues.concurrentRequests
    })
    this.clientUrl = url instanceof URL ? url : new URL(url)
    this.timeout = init.timeout ?? defaultValues.timeout
    log('enabled Reframe routing via', url)
  }

  isStarted (): boolean {
    return this.started
  }

  start (): void {
    this.started = true
  }

  stop (): void {
    this.httpQueue.clear()
    this.shutDownController.abort()
    this.started = false
  }

  async * findProviders (key: CID, options: AbortOptions = {}): AsyncIterable<PeerInfo> {
    log('findProviders starts: %c', key)

    const signal = anySignal([this.shutDownController.signal, options.signal, AbortSignal.timeout(this.timeout)])
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      // https://github.com/ipfs/specs/blob/main/routing/ROUTING_V1_HTTP.md#api
      const resource = `${this.clientUrl}routing/v1/providers/${key.toString()}`
      const getOptions = { headers: { Accept: 'application/x-ndjson' }, signal }
      const a = await fetch(resource, getOptions)

      if (a.body == null) {
        throw new CodeError('Reframe response had no body', 'ERR_BAD_RESPONSE')
      }

      const body = await toBuffer(toIt(a.body))
      const result: ReframeV1Response = JSON.parse(uint8ArrayToString(body))

      for await (const event of result.Providers) {
        if (event.Protocol !== 'transport-bitswap' || event.Schema !== 'bitswap') {
          continue
        }

        yield this.mapEvent(event)
      }
    } catch (err) {
      log.error('findProviders errored:', err)
    } finally {
      signal.clear()
      onFinish.resolve()
      log('findProviders finished: %c', key)
    }
  }

  private mapEvent (event: ReframeV1ResponseItem): PeerInfo {
    const peer = peerIdFromString(event.ID)
    const ma: Multiaddr[] = []

    for (const strAddr of event.Addrs) {
      const addr = multiaddr(strAddr)
      ma.push(addr)
    }

    const pi = {
      id: peer,
      multiaddrs: ma,
      protocols: []
    }

    return pi
  }

  async provide (): Promise<void> {
    // noop
  }

  async put (): Promise<void> {
    // noop
  }

  async get (): Promise<Uint8Array> {
    throw new CodeError('Not found', 'ERR_NOT_FOUND')
  }
}

export function reframeContentRouting (url: string | URL, init: ReframeContentRoutingInit = {}): () => ContentRouting {
  return () => new ReframeContentRouting(url, init)
}
