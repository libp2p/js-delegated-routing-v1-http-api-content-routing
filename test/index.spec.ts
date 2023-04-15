/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { ReframeV1ResponseItem, reframeContentRouting } from '../src/index.js'
import { CID } from 'multiformats/cid'
import all from 'it-all'

if (process.env.ECHO_SERVER == null) {
  throw new Error('Echo server not configured correctly')
}

const serverUrl = process.env.ECHO_SERVER
const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

describe('ReframeContentRouting', function () {
  it('should find providers', async () => {
    const providers: ReframeV1ResponseItem[] = [{
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      ID: (await createEd25519PeerId()).toString(),
      Addrs: ['/ip4/41.41.41.41/tcp/1234']
    }, {
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      ID: (await createEd25519PeerId()).toString(),
      Addrs: ['/ip4/42.42.42.42/tcp/1234']
    }]

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: JSON.stringify({
        Providers: providers
      })
    })

    const routing = reframeContentRouting(serverUrl)()

    const provs = await all(routing.findProviders(cid))
    expect(provs.map(prov => ({
      id: prov.id.toString(),
      addrs: prov.multiaddrs.map(ma => ma.toString())
    }))).to.deep.equal(providers.map(prov => ({
      id: prov.ID,
      addrs: prov.Addrs
    })))
  })

  it('should handle non-json input', async () => {
    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: 'not json'
    })

    const routing = reframeContentRouting(serverUrl)()

    const provs = await all(routing.findProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should handle bad input providers', async () => {
    const providers = [{
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      Bad: 'field'
    }, {
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      ID: 'not a peer id'
    }, {
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      ID: (await createEd25519PeerId()).toString(),
      Addrs: ['not a multiaddr']
    }]

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: JSON.stringify({
        Providers: providers
      })
    })

    const routing = reframeContentRouting(serverUrl)()

    const provs = await all(routing.findProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should handle empty input', async () => {
    const routing = reframeContentRouting(serverUrl)()

    const provs = await all(routing.findProviders(cid))
    expect(provs).to.be.empty()
  })
})
