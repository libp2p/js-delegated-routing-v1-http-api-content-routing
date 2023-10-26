import { type DelegatedRoutingV1HttpApiClient, createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import { CodeError } from '@libp2p/interface/errors'
import { logger } from '@libp2p/logger'
import { peerIdFromBytes } from '@libp2p/peer-id'
import { marshal, unmarshal } from 'ipns'
import map from 'it-map'
import { equals as uint8ArrayEquals } from 'uint8arrays/equals'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import type { AbortOptions } from '@libp2p/interface'
import type { ContentRouting } from '@libp2p/interface/content-routing'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { PeerInfo } from '@libp2p/interface/peer-info'
import type { Startable } from '@libp2p/interface/startable'
import type { CID } from 'multiformats/cid'

const log = logger('delegated-routing-v1-http-api-content-routing')

const IPNS_PREFIX = uint8ArrayFromString('/ipns/')

function isIPNSKey (key: Uint8Array): boolean {
  return uint8ArrayEquals(key.subarray(0, IPNS_PREFIX.byteLength), IPNS_PREFIX)
}

const peerIdFromRoutingKey = (key: Uint8Array): PeerId => {
  return peerIdFromBytes(key.slice(IPNS_PREFIX.length))
}

export interface DelegatedRoutingV1HTTPAPIContentRoutingInit {
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

/**
 * An implementation of content routing, using a delegated peer
 */
class DelegatedRoutingV1HTTPAPIContentRouting implements ContentRouting, Startable {
  private started: boolean
  private readonly client: DelegatedRoutingV1HttpApiClient

  /**
   * Create a new DelegatedContentRouting instance
   */
  constructor (url: string | URL, init: DelegatedRoutingV1HTTPAPIContentRoutingInit = {}) {
    this.started = false
    this.client = createDelegatedRoutingV1HttpApiClient(new URL(url), init)

    log('enabled Delegated Routing V1 HTTP API Content Routing via', url)
  }

  isStarted (): boolean {
    return this.started
  }

  start (): void {
    this.started = true
  }

  stop (): void {
    this.client.stop()
    this.started = false
  }

  async * findProviders (cid: CID, options: AbortOptions = {}): AsyncIterable<PeerInfo> {
    yield * map(this.client.getProviders(cid, options), (record) => {
      return {
        id: record.ID,
        multiaddrs: record.Addrs ?? [],
        protocols: []
      }
    })
  }

  async provide (): Promise<void> {
    // noop
  }

  async put (key: Uint8Array, value: Uint8Array, options?: AbortOptions): Promise<void> {
    if (!isIPNSKey(key)) {
      return
    }

    const peerId = peerIdFromRoutingKey(key)
    const record = unmarshal(value)

    await this.client.putIPNS(peerId, record, options)
  }

  async get (key: Uint8Array, options?: AbortOptions): Promise<Uint8Array> {
    if (!isIPNSKey(key)) {
      throw new CodeError('Not found', 'ERR_NOT_FOUND')
    }

    const peerId = peerIdFromRoutingKey(key)
    const record = await this.client.getIPNS(peerId, options)

    return marshal(record)
  }
}

export function delgatedRoutingV1HTTPAPIContentRouting (url: string | URL, init: DelegatedRoutingV1HTTPAPIContentRoutingInit = {}): () => ContentRouting {
  return () => new DelegatedRoutingV1HTTPAPIContentRouting(url, init)
}
